import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  orderBy,
  setDoc,
  limit,
  collectionGroup,
  writeBatch
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Book, Chapter, BookType, BookLength, ChapterLength } from "../types";

const getDevSetting = (key: string) => localStorage.getItem(key) === 'true';

const logFirestore = (message: string, data?: any) => {
    if (getDevSetting('storyspark-dev-firestore-debug')) {
        console.groupCollapsed(`🔥 Firestore: ${message}`);
        if (data) {
            try {
                console.log(JSON.parse(JSON.stringify(data)));
            } catch (e) {
                console.log(data);
            }
        }
        console.trace(); 
        console.groupEnd();
    }
};

/**
 * Firestore does not allow '.', '=', '/', '[', ']', '$', or '#' in map keys. 
 * We use a robust encoding to ensure Perchance data (including Base64) is safe.
 */
const encodeKey = (key: string): string => {
    return key
        .replace(/\$/g, '__DS__')
        .replace(/\./g, '__DT__')
        .replace(/\[/g, '__LB__')
        .replace(/\]/g, '__RB__')
        .replace(/\//g, '__SL__')
        .replace(/#/g, '__HS__')
        .replace(/=/g, '__EQ__');
};

const decodeKey = (key: string): string => {
    return key
        .replace(/__DS__/g, '$')
        .replace(/__DT__/g, '.')
        .replace(/__LB__/g, '[')
        .replace(/__RB__/g, ']')
        .replace(/__SL__/g, '/')
        .replace(/__HS__/g, '#')
        .replace(/__EQ__/g, '=');
};

const sanitize = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      const value = obj[key];
      if (value !== undefined) {
        const cleanKey = encodeKey(key);
        acc[cleanKey] = sanitize(value);
      }
      return acc;
    }, {});
  }
  return obj;
};

const desanitize = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(desanitize);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc: any, key: string) => {
            const value = obj[key];
            const originalKey = decodeKey(key);
            acc[originalKey] = desanitize(value);
            return acc;
        }, {});
    }
    return obj;
};

/**
 * Heuristic to guess book type from content if metadata is missing
 */
const inferBookTypeFromContent = (content: string): BookType => {
    const lower = content.toLowerCase();
    if (lower.includes("what do you do?") || lower.includes("hp:") || lower.includes("inventory:")) {
        return BookType.Adventure;
    }
    return BookType.Original;
};

export const runFirestoreDiagnostics = async (userId: string) => {
    const logs: string[] = [];
    const log = (m: string) => { console.log(`[DIAG] ${m}`); logs.push(m); };
    
    if (!userId) {
        log("❌ Error: No User ID provided for diagnostics.");
        return logs;
    }

    const cleanUid = userId.trim();
    log(`Starting Diagnostics for UID: ${cleanUid}`);
    
    log("--- STEP 1: WRITE TEST ---");
    try {
        const testRef = await addDoc(collection(db, "_diagnostics"), {
            userId: cleanUid,
            timestamp: new Date().toISOString()
        });
        log(`✅ Write successful: ${testRef.id}`);
        await deleteDoc(testRef);
    } catch (e: any) {
        log(`❌ Write Failed: ${e.code || e.message}`);
    }

    log("--- STEP 2: STANDARD SEARCH ---");
    try {
        const q = query(collection(db, "books"), where("userId", "==", cleanUid));
        const snapshot = await getDocs(q);
        log(`Standard Search: ${snapshot.size} books found.`);
    } catch (e: any) {
        log(`❌ Standard Search Failed: ${e.code || e.message}`);
    }

    log("--- STEP 3: DEEP SEARCH ---");
    try {
        const chQ = query(collectionGroup(db, 'chapters'), where('userId', '==', cleanUid), limit(10));
        const chSnap = await getDocs(chQ);
        log(`✅ Deep Search functional: ${chSnap.size} chapters scanned.`);
    } catch (e: any) {
        if (e.message && e.message.includes('https://console.firebase.google.com')) {
            const urlMatch = e.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
            if (urlMatch) {
                log("⚠️ INDEX REQUIRED. Use the link below:");
                log(urlMatch[0]);
            } else {
                log(`❌ Index missing or generic error: ${e.message}`);
            }
        } else {
            log(`❌ Deep Search Error: ${e.code || e.message}`);
        }
    }
    
    return logs;
};

export const getBooksForUser = async (userId: string): Promise<Book[]> => {
  if (!userId) return [];
  const cleanUid = userId.trim();
  const foundBooks = new Map<string, Book>();

  // 1. Standard Query
  try {
    const q = query(collection(db, "books"), where("userId", "==", cleanUid));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => {
        foundBooks.set(d.id, { id: d.id, ...d.data() } as Book);
    });
  } catch (e: any) {
    // Silence expected permission noise for orphan recovery
  }

  // 2. Chapter-based Recovery
  try {
    const chQ = query(collectionGroup(db, 'chapters'), where('userId', '==', cleanUid));
    const chSnap = await getDocs(chQ);
    
    const chaptersByBook = new Map<string, Chapter[]>();
    chSnap.forEach(d => {
        const c = { id: d.id, ...d.data() } as Chapter;
        const bookRef = d.ref.parent.parent; 
        if (bookRef) {
            const bId = bookRef.id;
            if (!chaptersByBook.has(bId)) chaptersByBook.set(bId, []);
            chaptersByBook.get(bId)?.push(c);
        }
    });

    for (const [bookId, chapters] of chaptersByBook.entries()) {
        if (!foundBooks.has(bookId)) {
            let bookData: Book | null = null;
            try {
                const bookSnap = await getDoc(doc(db, "books", bookId));
                if (bookSnap.exists()) {
                    bookData = { id: bookId, ...bookSnap.data() } as Book;
                }
            } catch (err) {
                // Metadata check failed, handled by reconstruction below
            }

            if (bookData) {
                bookData.chapters = chapters;
                bookData.chapterCount = chapters.length;
                foundBooks.set(bookId, bookData);
            } else {
                chapters.sort((a, b) => (a.index || 0) - (b.index || 0));
                const firstContent = chapters[0]?.content || "";
                const titleMatch = firstContent.match(/^#\s(.*?)$/m);
                const guessedType = inferBookTypeFromContent(firstContent);
                
                foundBooks.set(bookId, {
                    id: bookId,
                    userId: cleanUid,
                    title: (titleMatch ? titleMatch[1] : `Restored Book`) + ' (Restored)',
                    chapters,
                    chapterCount: chapters.length,
                    updatedAt: new Date().toISOString(),
                    request: { 
                        type: guessedType, 
                        plot: 'Content restored from cloud chapters.', 
                        bookLength: BookLength.Medium, 
                        chapterLength: ChapterLength.Medium,
                        persona: guessedType === BookType.Adventure ? { name: "Player", age: "??", gender: "Unknown" } : undefined
                    } as any
                } as Book);
            }
        } else {
            const existing = foundBooks.get(bookId)!;
            if (!existing.chapters || existing.chapters.length === 0) {
                existing.chapters = chapters;
                existing.chapterCount = chapters.length;
            }
        }
    }
  } catch (e: any) {
      // Only log critical errors if not a permission issue (common with strict rules)
      if (e.code !== 'permission-denied') {
          console.warn("Deep Search Recovery skipped:", e.message);
      }
  }

  return Array.from(foundBooks.values()).sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
  });
};

export const createBook = async (userId: string, bookData: Omit<Book, 'id'>): Promise<string> => {
  const data = sanitize({
    ...bookData,
    userId: userId.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const docRef = await addDoc(collection(db, "books"), data);
  return docRef.id;
};

export const getFullBook = async (bookId: string): Promise<Book | null> => {
    const currentUser = auth.currentUser;
    
    try {
        let bookData: Book | null = null;
        try {
            const docRef = doc(db, "books", bookId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                bookData = { id: docSnap.id, ...docSnap.data() } as Book;
            }
        } catch (e) {
            // Expected for some legacy structures
        }

        let chapters: Chapter[] = [];

        // Try direct access first
        try {
            const chaptersQ = query(collection(db, "books", bookId, "chapters"), orderBy("index", "asc"));
            const chaptersSnap = await getDocs(chaptersQ);
            chapters = chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));
        } catch (e) {
            // Fallback: If direct access is denied, use the working Collection Group rule
            if (currentUser) {
                try {
                    const deepQ = query(collectionGroup(db, 'chapters'), where('userId', '==', currentUser.uid));
                    const deepSnap = await getDocs(deepQ);
                    
                    // Filter in memory for the correct parent
                    chapters = deepSnap.docs
                        .filter(d => d.ref.parent.parent?.id === bookId)
                        .map(d => ({ id: d.id, ...d.data() } as Chapter))
                        .sort((a, b) => (a.index || 0) - (b.index || 0));
                    
                } catch (deepErr) {
                    console.error("Critical: Recovery path failed.", deepErr);
                }
            }
        }
        
        if (chapters.length > 0) {
            if (!bookData) {
                 const firstContent = chapters[0]?.content || "";
                 const titleMatch = firstContent.match(/^#\s(.*?)$/m);
                 const guessedType = inferBookTypeFromContent(firstContent);
                 bookData = {
                     id: bookId,
                     userId: chapters[0].userId || currentUser?.uid,
                     title: (titleMatch ? titleMatch[1] : 'Restored') + ' (Restored)',
                     chapters,
                     chapterCount: chapters.length,
                     request: { 
                        type: guessedType, 
                        plot: 'Restored Context', 
                        bookLength: BookLength.Medium, 
                        chapterLength: ChapterLength.Medium,
                        persona: guessedType === BookType.Adventure ? { name: "Player", age: "??", gender: "Unknown" } : undefined
                     } as any
                 } as Book;
            } else {
                bookData.chapters = chapters;
                bookData.chapterCount = chapters.length;
            }
            return bookData;
        }
        
        return bookData; 
    } catch (e) {
        console.error("getFullBook critical failure:", e);
        throw e;
    }
};

export const updateBookMetadata = async (bookId: string, data: Partial<Book>) => {
    const docRef = doc(db, "books", bookId);
    const { chapters, ...meta } = data; 
    const sanitizedMeta = sanitize({ 
        ...meta, 
        updatedAt: new Date().toISOString() 
    });
    
    try {
        await updateDoc(docRef, sanitizedMeta);
    } catch (e) {
        // If update fails (e.g. parent doc missing/locked), try setDoc to (re)create it
        await setDoc(docRef, sanitizedMeta, { merge: true });
    }
};

export const addChapterToDb = async (userId: string, bookId: string, chapter: Chapter) => {
    const chaptersRef = doc(db, "books", bookId, "chapters", chapter.id);
    const sanitizedChapter = sanitize({ ...chapter, userId: userId.trim(), createdAt: new Date().toISOString() });
    await setDoc(chaptersRef, sanitizedChapter);
};

export const saveChapterToDb = async (userId: string, bookId: string, chapter: Chapter) => {
    const chapterRef = doc(db, "books", bookId, "chapters", chapter.id);
    const sanitizedChapter = sanitize({ ...chapter, userId: userId.trim() });
    await setDoc(chapterRef, sanitizedChapter, { merge: true });
};

export const deleteChapterFromDb = async (bookId: string, chapterId: string) => {
    await deleteDoc(doc(db, "books", bookId, "chapters", chapterId));
};

export const deleteBook = async (bookId: string) => {
    // 1. Delete all chapters in the subcollection
    try {
        let chaptersSnap;
        try {
            const chaptersQ = query(collection(db, "books", bookId, "chapters"));
            chaptersSnap = await getDocs(chaptersQ);
        } catch (e) {
            // Fallback for orphan deletion
            const currentUser = auth.currentUser;
            if (currentUser) {
                const deepQ = query(collectionGroup(db, 'chapters'), where('userId', '==', currentUser.uid));
                const deepSnap = await getDocs(deepQ);
                const refsToDelete = deepSnap.docs
                    .filter(d => d.ref.parent.parent?.id === bookId)
                    .map(d => d.ref);
                
                if (refsToDelete.length > 0) {
                    const batch = writeBatch(db);
                    refsToDelete.forEach(ref => batch.delete(ref));
                    await batch.commit();
                }
            }
        }
        
        if (chaptersSnap && chaptersSnap.size > 0) {
            const batch = writeBatch(db);
            chaptersSnap.docs.forEach(d => {
                batch.delete(d.ref);
            });
            await batch.commit();
        }
    } catch (e) {
        // Clean cleanup failure
    }

    // 2. Delete the parent document
    try {
        await deleteDoc(doc(db, "books", bookId));
    } catch (e) {
        // Expected if metadata doc is already missing
    }
};

/**
 * Perchance AI Story Generator Data Sync
 */
export const savePerchanceSyncData = async (userId: string, data: any) => {
    try {
        const docRef = doc(db, "perchance_sync", userId.trim());
        const sanitizedData = sanitize(data);
        await setDoc(docRef, {
            data: sanitizedData,
            updatedAt: new Date().toISOString()
        });
        logFirestore("Perchance Sync Saved Successfully");
    } catch (e) {
        console.error("🔥 Firestore: Critical Perchance Sync Error", e);
        throw e;
    }
};

export const getPerchanceSyncData = async (userId: string) => {
    const docRef = doc(db, "perchance_sync", userId.trim());
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return desanitize(snap.data().data);
    }
    return null;
};