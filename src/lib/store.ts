import { create } from 'zustand';
import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDoc,
  getDocs,
  serverTimestamp,
  runTransaction,
  increment
} from 'firebase/firestore';

export type TransactionSource = 'Manual' | 'OCR';
export type PocketType = 'Spendable' | 'Saving';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  storeName: string;
  source: TransactionSource;
  pocketId?: string;
}

export interface Pocket {
  id: string;
  name: string;
  icon: string;
  goalAmount: number;
  currentBalance: number;
  type: PocketType;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  budget: number;
  color?: string;
}

export interface UserPublic {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  highestStreak: number;
  points: number;
  totalTransactions: number;
}

export interface UserPrivate {
  email: string;
  questRerolls: number;
  isOnboarded: boolean;
  monthlyBudget: number;
  savingTarget: number;
  controlCategories: string[];
  financialChallenge: string;
  savingGoals: string[];
}

export interface User extends UserPublic, UserPrivate {}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  progress: number;
  target: number;
  type: 'daily' | 'weekly';
  isCompleted: boolean;
  category: 'Scanning' | 'Awareness' | 'Saving' | 'Smart';
}

interface BudgetStore {
  user: User;
  pockets: Pocket[];
  transactions: Transaction[];
  categories: Category[];
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  leaderboardUsers: UserPublic[];
  darkMode: boolean;
  isSyncing: boolean;
  isLeaderboardLoading: boolean;
  
  syncData: (userId: string) => () => void;
  fetchLeaderboard: () => Promise<void>;
  setDarkMode: (darkMode: boolean) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: (data: Partial<UserPrivate>) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addPocket: (pocket: Omit<Pocket, 'id'>) => Promise<void>;
  updatePocket: (id: string, updates: Partial<Pocket>) => Promise<void>;
  deletePocket: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategoryBudget: (id: string, budget: number) => Promise<void>;
  rerollQuest: (questId: string) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  transferMoney: (fromPocketId: string, toPocketId: string, amount: number) => Promise<void>;
}

export const useStore = create<BudgetStore>((set, get) => ({
  user: {
    id: "",
    name: "Adventurer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    email: "",
    streak: 0,
    highestStreak: 0,
    points: 0,
    questRerolls: 3,
    totalTransactions: 0,
    isOnboarded: false,
    monthlyBudget: 0,
    savingTarget: 0,
    controlCategories: [],
    financialChallenge: '',
    savingGoals: [],
  },
  pockets: [],
  transactions: [],
  categories: [],
  dailyQuests: [],
  weeklyQuests: [],
  leaderboardUsers: [],
  darkMode: typeof window !== 'undefined' ? localStorage.getItem('budgetquest-darkmode') === 'true' : false,
  isSyncing: false,
  isLeaderboardLoading: false,

  syncData: (userId) => {
    set({ isSyncing: true });
    
    // Sync Public Profile
    const publicRef = doc(db, 'users', userId);
    const unsubPublic = onSnapshot(publicRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Omit<UserPublic, 'id'>;
        set({ user: { ...get().user, ...data, id: userId } });
      } else {
        const newPublic: Omit<UserPublic, 'id'> = {
          name: auth.currentUser?.displayName || "Adventurer",
          avatar: auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          streak: 0,
          highestStreak: 0,
          points: 0,
          totalTransactions: 0,
        };
        try {
          await setDoc(publicRef, newPublic);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}`);
        }
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${userId}`));

    // Sync Private Settings
    const privateRef = doc(db, 'users', userId, 'private', 'settings');
    const unsubPrivate = onSnapshot(privateRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserPrivate;
        set({ user: { ...get().user, ...data } });
      } else {
        const newPrivate: UserPrivate = {
          email: auth.currentUser?.email || "",
          questRerolls: 3,
          isOnboarded: false,
          monthlyBudget: 0,
          savingTarget: 0,
          controlCategories: [],
          financialChallenge: '',
          savingGoals: [],
        };
        try {
          await setDoc(privateRef, newPrivate);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/private/settings`);
        }
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${userId}/private/settings`));

    // Sync Pockets
    const pocketsRef = collection(db, 'users', userId, 'pockets');
    const unsubPockets = onSnapshot(pocketsRef, (snapshot) => {
      const pockets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Pocket));
      set({ pockets });
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${userId}/pockets`));

    // Sync Transactions
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const unsubTransactions = onSnapshot(transactionsRef, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ transactions });
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${userId}/transactions`));

    // Sync Categories
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const unsubCategories = onSnapshot(categoriesRef, async (snapshot) => {
      const categories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
      set({ categories });
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${userId}/categories`));

    // Sync Quests
    const questsRef = collection(db, 'users', userId, 'quests');
    const unsubQuests = onSnapshot(questsRef, async (snapshot) => {
      let allQuests = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Quest));
      
      if (snapshot.empty) {
        // Initialize default quests if none exist
        const defaultQuests: Omit<Quest, 'id'>[] = [
          { title: 'Scan 3 receipts', description: 'Scan 3 receipts today', xp: 50, progress: 0, target: 3, type: 'daily', isCompleted: false, category: 'Scanning' },
          { title: 'Budget Awareness', description: 'Stay within your daily spending limit', xp: 30, progress: 0, target: 1, type: 'daily', isCompleted: false, category: 'Awareness' },
          { title: 'Save RM 5', description: 'Save RM 5 today', xp: 40, progress: 0, target: 5, type: 'daily', isCompleted: false, category: 'Saving' },
          { title: 'Savings Builder', description: 'Save RM 50 in total this week', xp: 200, progress: 0, target: 50, type: 'weekly', isCompleted: false, category: 'Saving' },
        ];
        
        try {
          // Add them sequentially to avoid issues
          for (const q of defaultQuests) {
            await addDoc(questsRef, q);
          }
          // Note: The additions will trigger this snapshot listener again
          set({ isSyncing: false });
          return; 
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/quests`);
          set({ isSyncing: false });
        }
      }

      set({ 
        dailyQuests: allQuests.filter(q => q.type === 'daily'),
        weeklyQuests: allQuests.filter(q => q.type === 'weekly'),
        isSyncing: false
      });
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${userId}/quests`));

    return () => {
      unsubPublic();
      unsubPrivate();
      unsubPockets();
      unsubTransactions();
      unsubCategories();
      unsubQuests();
    };
  },

  fetchLeaderboard: async () => {
    set({ isLeaderboardLoading: true });
    try {
      // Points based leaderboard
      const usersRef = collection(db, 'users');
      // We can't use complex queries in rules effectively without indexes if they are across different owners,
      // but here we allow public read on the users collection for leaderboard.
      // Note: We'll use a simple getDocs and sort in memory for now if there are few users, 
      // or a proper orderBy if the rule allows it.
      const { 
        getDocs, 
        orderBy, 
        limit 
      } = await import('firebase/firestore');
      
      const q = query(usersRef, orderBy('points', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const leaderboardUsers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserPublic));
      set({ leaderboardUsers, isLeaderboardLoading: false });
    } catch (e) {
      console.error("Leaderboard fetch failed", e);
      set({ isLeaderboardLoading: false });
    }
  },

  setDarkMode: (darkMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('budgetquest-darkmode', String(darkMode));
    }
    set({ darkMode });
  },
  
  updateUser: async (updates) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      // Split updates between public and private
      const publicUpdates: Partial<UserPublic> = {};
      const privateUpdates: Partial<UserPrivate> = {};
      
      const publicKeys: (keyof UserPublic)[] = ['name', 'avatar', 'streak', 'highestStreak', 'points', 'totalTransactions'];
      const privateKeys: (keyof UserPrivate)[] = ['email', 'questRerolls', 'isOnboarded', 'monthlyBudget', 'savingTarget', 'controlCategories', 'financialChallenge', 'savingGoals'];
      
      const pUpdates = publicUpdates as any;
      const prUpdates = privateUpdates as any;
      
      Object.keys(updates).forEach((key) => {
        if (publicKeys.includes(key as keyof UserPublic)) {
          pUpdates[key] = (updates as any)[key];
        } else if (privateKeys.includes(key as keyof UserPrivate)) {
          prUpdates[key] = (updates as any)[key];
        }
      });

      if (Object.keys(publicUpdates).length > 0) {
        await updateDoc(doc(db, 'users', userId), publicUpdates);
      }
      if (Object.keys(privateUpdates).length > 0) {
        await updateDoc(doc(db, 'users', userId, 'private', 'settings'), privateUpdates);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },

  completeOnboarding: async (data) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      const privateRef = doc(db, 'users', userId, 'private', 'settings');
      await updateDoc(privateRef, {
        ...data,
        isOnboarded: true
      });

      // Create category documents for control categories if they don't exist
      if (data.controlCategories && data.controlCategories.length > 0) {
        const categoriesRef = collection(db, 'users', userId, 'categories');
        const icons: Record<string, string> = {
          'Food': '🍕',
          'Shopping': '🛍️',
          'Transport': '🚗',
          'Entertainment': '🎮',
          'Bills': '📄',
          'Other': '📦'
        };
        for (const catName of data.controlCategories) {
          await addDoc(categoriesRef, {
            name: catName,
            icon: icons[catName] || '📁',
            budget: 500 // Default budget
          });
        }
      }

      // Also create an initial "Spendable" pocket if none exist
      const pocketsRef = collection(db, 'users', userId, 'pockets');
      await addDoc(pocketsRef, {
        name: 'Main Wallet',
        icon: 'Wallet',
        goalAmount: 0,
        currentBalance: data.monthlyBudget || 0,
        type: 'Spendable'
      });

    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/onboarding`);
    }
  },

  addTransaction: async (tx) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    try {
      const txRef = collection(db, 'users', userId, 'transactions');
      await addDoc(txRef, tx);

      // Update pocket balance
      if (tx.pocketId) {
        await updateDoc(doc(db, 'users', userId, 'pockets', tx.pocketId), {
          currentBalance: increment(tx.amount)
        });
      }

      // Update user points and total transactions
      await updateDoc(doc(db, 'users', userId), {
        points: increment(10),
        totalTransactions: increment(1)
      });

      // Update quest progress if OCR
      if (tx.source === 'OCR') {
        const scanningQuests = [...get().dailyQuests, ...get().weeklyQuests]
          .filter(q => q.category === 'Scanning' && !q.isCompleted);
        
        for (const q of scanningQuests) {
          await updateDoc(doc(db, 'users', userId, 'quests', q.id), {
            progress: Math.min(q.target, q.progress + 1)
          });
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}/transactions`);
    }
  },

  deleteTransaction: async (id) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'transactions', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${userId}/transactions/${id}`);
    }
  },

  addPocket: async (pocket) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await addDoc(collection(db, 'users', userId, 'pockets'), pocket);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}/pockets`);
    }
  },

  updatePocket: async (id, updates) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'pockets', id), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/pockets/${id}`);
    }
  },

  deletePocket: async (id) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'pockets', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${userId}/pockets/${id}`);
    }
  },

  transferMoney: async (fromPocketId, toPocketId, amount) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    const fromPocket = get().pockets.find(p => p.id === fromPocketId);
    const toPocket = get().pockets.find(p => p.id === toPocketId);
    
    if (!fromPocket || !toPocket) return;
    
    try {
      const fromRef = doc(db, 'users', userId, 'pockets', fromPocketId);
      const toRef = doc(db, 'users', userId, 'pockets', toPocketId);
      
      // Fetch relevant quests before starting the transaction
      const questsRef = collection(db, 'users', userId, 'quests');
      const q = query(questsRef, where('category', '==', 'Saving'), where('isCompleted', '==', false));
      const questSnapshot = await getDocs(q);
      const savingQuests = questSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Quest));

      await runTransaction(db, async (transaction) => {
        const fromDoc = await transaction.get(fromRef);
        const toDoc = await transaction.get(toRef);
        
        if (!fromDoc.exists() || !toDoc.exists()) {
          throw new Error("Pocket does not exist!");
        }
        
        const newFromBalance = fromDoc.data().currentBalance - amount;
        const newToBalance = toDoc.data().currentBalance + amount;
        
        transaction.update(fromRef, { currentBalance: newFromBalance });
        transaction.update(toRef, { currentBalance: newToBalance });

        // Update Saving Quests progress
        if (toPocket.type === 'Saving' && amount > 0) {
          for (const questData of savingQuests) {
            // Get fresh quest data within transaction for total accuracy
            const questRef = doc(db, 'users', userId, 'quests', questData.id);
            const questDoc = await transaction.get(questRef);
            
            if (questDoc.exists()) {
              const currentQuest = questDoc.data() as Quest;
              const newProgress = Math.min(currentQuest.target, currentQuest.progress + amount);
              const isNewlyCompleted = newProgress >= currentQuest.target && !currentQuest.isCompleted;
              
              transaction.update(questRef, {
                progress: newProgress,
                isCompleted: newProgress >= currentQuest.target
              });
              
              if (isNewlyCompleted) {
                const userRef = doc(db, 'users', userId);
                transaction.update(userRef, { 
                  points: increment(currentQuest.xp)
                });
              }
            }
          }
        }
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/pockets/transfer`);
    }
  },

  addCategory: async (category) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await addDoc(collection(db, 'users', userId, 'categories'), category);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}/categories`);
    }
  },

  updateCategory: async (id, updates) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'categories', id), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/categories/${id}`);
    }
  },

  deleteCategory: async (id) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'categories', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${userId}/categories/${id}`);
    }
  },

  updateCategoryBudget: async (id, budget) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'categories', id), { budget });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/categories/${id}`);
    }
  },

  rerollQuest: async (questId) => {
    const userId = auth.currentUser?.uid;
    if (!userId || get().user.questRerolls <= 0) return;

    const allDailyPool: Omit<Quest, 'id' | 'progress' | 'isCompleted'>[] = [
      { title: 'Scan 3 receipts', description: 'Scan 3 receipts today', xp: 50, type: 'daily', target: 3, category: 'Scanning' },
      { title: 'Log every purchase', description: 'Log every purchase you make today', xp: 40, type: 'daily', target: 1, category: 'Scanning' },
      { title: 'Budget Guardian', description: 'Stay within your daily spending limit', xp: 30, type: 'daily', target: 1, category: 'Awareness' },
      { title: 'Save RM 5', description: 'Save RM 5 today', xp: 40, type: 'daily', target: 5, category: 'Saving' },
    ];

    const randomQuest = allDailyPool[Math.floor(Math.random() * allDailyPool.length)];
    const newQuest = {
      ...randomQuest,
      progress: 0,
      isCompleted: false
    };

    try {
      await updateDoc(doc(db, 'users', userId, 'private', 'settings'), { questRerolls: get().user.questRerolls - 1 });
      await setDoc(doc(db, 'users', userId, 'quests', questId), newQuest);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/quests/${questId}`);
    }
  },

  completeQuest: async (questId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const quest = [...get().dailyQuests, ...get().weeklyQuests].find(q => q.id === questId);
    if (!quest || quest.isCompleted) return;

    try {
      await updateDoc(doc(db, 'users', userId, 'quests', questId), {
        isCompleted: true,
        progress: quest.target
      });
      await updateDoc(doc(db, 'users', userId), {
        points: get().user.points + quest.xp
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}/quests/${questId}`);
    }
  },

  addPoints: async (points) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        points: get().user.points + points
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },
}));
