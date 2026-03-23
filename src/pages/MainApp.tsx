import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Compass, Footprints, Wallet, LogOut, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ChatArea from '../components/ChatArea';
import RightPanelTabs, { type RightTabType } from '../components/RightPanelTabs';
import type { ChatMessage, ExpenseItem, LocationPin, JourneyEntry, TravelPlan, PostTripStatus } from '../services/ai';
import { processUserMessage } from '../services/ai';
import { dbService } from '../services/db';
import { ExpenseActionSheet } from '../components/accounting/ExpenseActionSheet';

const dummyInitialMessage: ChatMessage = {
  id: 'msg-0',
  role: 'assistant',
  content: '嗨囉！我是咻妮！💕 今天想去哪裡玩？買了什麼好東西？儘管跟我說，我幫你記下來！✨',
  timestamp: new Date()
};

const TRIP_ID = 'trip_shuni_demo';

export default function MainApp() {
  const { logout, userProfile, user } = useAuth();
  const [mobileTab, setMobileTab] = useState<'chat' | RightTabType>('chat');
  
  const [messages, setMessages] = useState<ChatMessage[]>([dummyInitialMessage]);
  const [isTyping, setIsTyping] = useState(false);
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  
  const [phase, setPhase] = useState<'idle' | 'planning' | 'traveling' | 'post_trip'>('idle');
  const [travelPlan, setTravelPlan] = useState<TravelPlan | undefined>(undefined);
  const [postTripStatus, setPostTripStatus] = useState<PostTripStatus | undefined>(undefined);

  // Firestore Sync Effect
  useEffect(() => {
    if (!user) return; // Ignore if local dev bypass
    const uid = user.uid;
    
    // Initialize trip explicitly if it doesn't exist
    dbService.getOrInitializeTrip(uid, TRIP_ID);

    const unsubData = dbService.subscribeToTripData(uid, TRIP_ID, (data) => {
      if (data.phase) setPhase(data.phase);
      if (data.travelPlan) setTravelPlan(data.travelPlan);
      if (data.postTripStatus) setPostTripStatus(data.postTripStatus);
    });

    const unsubMsgs = dbService.subscribeToMessages(uid, TRIP_ID, (fetchedMsgs) => {
      if (fetchedMsgs.length > 0) {
        setMessages(fetchedMsgs);
      }
    });

    return () => { unsubData(); unsubMsgs(); };
  }, [user]);

  // Derive Expenses, Locations, and JourneyEntries from History
  const { expenses, locations, journeyEntries } = useMemo(() => {
    const expsMap = new Map<string, { exp: ExpenseItem, msg: ChatMessage }>();
    const locsMap = new Map<string, { loc: LocationPin, msg: ChatMessage }>();
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        let foundLocation = msg.location;

        // Fallback: If AI put location inside expense but forgot top-level location
        if (!foundLocation && msg.expenses && msg.expenses.length > 0) {
          const expWithLoc = msg.expenses.find(e => e.location);
          if (expWithLoc && expWithLoc.location) {
             foundLocation = { name: expWithLoc.location, description: `在${expWithLoc.location}的足跡`, timestamp: msg.timestamp };
          }
        }

        if (foundLocation) {
          locsMap.set(foundLocation.name, { loc: foundLocation, msg });
        }

        if (msg.expenses && msg.expenses.length > 0) {
          msg.expenses.forEach(exp => {
            const key = `${exp.description}_${exp.amount}`;
            expsMap.set(key, { exp, msg });
          });
        }
      }
    });

    const exps: ExpenseItem[] = [];
    const locs: LocationPin[] = [];
    const entriesWithTime: { entry: JourneyEntry, timeMs: number }[] = [];

    locsMap.forEach(({ loc, msg }, key) => {
      locs.push(loc);
      entriesWithTime.push({
        entry: {
          id: `je-loc-${msg.id}-${encodeURIComponent(key)}`, time: msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          type: 'checkin', title: `📍 ${loc.name}`, detail: loc.description, location: loc.name
        },
        timeMs: msg.timestamp.getTime()
      });
    });

    expsMap.forEach(({ exp, msg }, key) => {
      exps.push(exp);
      entriesWithTime.push({
        entry: {
          id: `je-exp-${msg.id}-${encodeURIComponent(key)}`, time: msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          type: 'expense', title: exp.description || '消費', amount: exp.amount, currency: exp.currency, category: exp.category
        },
        timeMs: msg.timestamp.getTime()
      });
    });

    entriesWithTime.sort((a, b) => a.timeMs - b.timeMs);
    
    return { 
      expenses: exps, 
      locations: locs, 
      journeyEntries: entriesWithTime.map(e => e.entry) 
    };
  }, [messages]);

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      ...(imageUrl && { imageUrl })
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      // MASTER TIMEOUT: Ensure the UI never hangs indefinitely, even if Firebase SDK or Fetch completely locks up
      const masterTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Master UI Timeout Exceeded")), 25000)
      );

      await Promise.race([
        (async () => {
          // Pass the entire history and current phase
          const { 
            response, 
            actionRequired,
            expenses: newExpenses, 
            location: newLocation,
            travelPlan: newPlan,
            postTripStatus: newPostTrip,
            newPhase
          } = await processUserMessage(text, messages, phase);
          
          // Strip out undefined fields so Firestore doesn't reject the save
          const finalUserMsg: ChatMessage = { ...tempUserMsg };
          if (newExpenses !== undefined) finalUserMsg.expenses = newExpenses;
          if (newLocation !== undefined) finalUserMsg.location = newLocation;
          
          // Phase 14: Fire-and-forget Firestore updates to prevent UI deadlocks if WebSocket connection is unstable
          if (user) {
            dbService.addMessage(user.uid, TRIP_ID, finalUserMsg).catch(err => console.warn("Background DB sync failed:", err));
            
            const tripUpdate: any = { phase: newPhase };
            if (newPlan !== undefined) tripUpdate.travelPlan = newPlan;
            if (newPostTrip !== undefined) tripUpdate.postTripStatus = newPostTrip;
            
            dbService.updateTripState(user.uid, TRIP_ID, tripUpdate).catch(err => console.warn("Background TripState sync failed:", err));
          }

          // ALWAYS update React UI State optimally right away
          setMessages(prev => prev.map(m => m.id === finalUserMsg.id ? finalUserMsg : m));
          if (newPlan) setTravelPlan(newPlan);
          if (newPostTrip) setPostTripStatus(newPostTrip);
          if (newPhase !== phase) setPhase(newPhase);

          if (newPhase !== phase) {
            // Automatically switch to Travel Plan tab if AI triggers planning or traveling
            if (newPhase === 'planning' || newPhase === 'traveling' || newPhase === 'post_trip') {
              setMobileTab('plan');
            }
          }

          const xiuniMsg: ChatMessage = {
            id: `msg-xiuni-${Date.now()}`,
            role: 'assistant',
            content: response,
            timestamp: new Date()
          };

          // Optimistically show AI response immediately
          setMessages(prev => [...prev, xiuniMsg]);

          if (user) {
            dbService.addMessage(user.uid, TRIP_ID, xiuniMsg).catch(err => console.warn("Background AI msg sync failed:", err));
          }

          if (actionRequired === 'open_expense_sheet') {
            // Slight delay ensures the message renders before the modal covers it
            setTimeout(() => setIsExpenseSheetOpen(true), 500);
          }
        })(),
        masterTimeout
      ]);
      
    } catch(err) {
      console.error("Critical error in message handling (likely timeout or network drop):", err);
      // Fallback UI rescue message if EVERYTHING fails
      setMessages(prev => [...prev, {
        id: `msg-xiuni-rescue-${Date.now()}`,
        role: 'assistant',
        content: "嗚嗚...剛才好像有訊號干擾，我沒聽到！🥺 寶寶再說一次好嗎？",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExpenseSubmit = async (amount: number, description: string, paymentMethod: string) => {
    // Generate new expense item
    const expense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      amount,
      currency: 'TWD',
      category: 'other',
      description,
      paymentMethod,
      timestamp: new Date()
    };

    setIsTyping(true); // Show typing while evaluating

    try {
      let statusInfo: { status: 'cash' | 'safe' | 'warning', cardName: string, currentTotal: number, spendCap: number } = { 
        status: 'safe', cardName: '', currentTotal: 0, spendCap: 0 
      };
      
      // Calculate limit via backend
      if (user) {
        const res = await dbService.addTransactionWithCheck(user.uid, TRIP_ID, expense, expenses);
        statusInfo = { ...res, cardName: res.cardName || '' };
      } else {
        // Fallback for anonymous
        if (paymentMethod === '現金') statusInfo.status = 'cash';
        else statusInfo = { status: 'safe', cardName: paymentMethod, currentTotal: 0, spendCap: 5000 };
      }

      // Generate exact Xiuni Response based on user prompt criteria
      let xiuniText = "";
      if (statusInfo.status === 'cash') {
        xiuniText = "真假👀？現在還有人在用現金喔，破防了🫠。好啦幫你記上了，下次記得刷卡賺回饋帶咻妮去喝珍奶🥺🧋。";
      } else if (statusInfo.status === 'warning') {
        xiuniText = `欸不是寶寶，你這張 [${statusInfo.cardName}] 額度已經刷到 90% 以上了！你是要氣死咻妮嗎🤯🔪？下一筆結帳給我乖乖換別張卡，不然少賺的回饋你要怎麼賠給我😤💸給我注意一點💢！`;
      } else {
        xiuniText = "記好囉寶寶✨！這張卡還有很多回饋額度，算你聰明有聽咻妮的話，繼續買！買爆！💸❤️🔥";
      }

      const xiuniMsg: ChatMessage = {
        id: `msg-xiuni-expense-${Date.now()}`,
        role: 'assistant',
        content: xiuniText,
        timestamp: new Date()
      };

      // Optimistic UI updates
      setMessages(prev => [...prev, xiuniMsg]);
      setMobileTab('chat'); // ensure they see the chat response

      if (user) {
        dbService.addMessage(user.uid, TRIP_ID, xiuniMsg).catch(console.warn);
      }

    } catch (err) {
      console.error("Expense check failed:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleUpdatePlan = (updatedPlan: TravelPlan) => {
    setTravelPlan(updatedPlan);
    if (user) {
      // Fire and forget Firestore save
      dbService.updateTripState(user.uid, TRIP_ID, { travelPlan: updatedPlan }).catch(console.warn);
    }
  };

  const renderContent = () => {
    switch (mobileTab) {
      case 'chat': return <ChatArea messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} />;
      default: return (
        <RightPanelTabs 
          expenses={expenses} entries={journeyEntries} locations={locations} forceTab={mobileTab as RightTabType} 
          travelPlan={travelPlan} postTripStatus={postTripStatus} phase={phase} onUpdatePlan={handleUpdatePlan}
        />
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background lg:flex-row overflow-hidden relative">
      {/* 
        DESKTOP LAYOUT: 
        Left Side: Main Chat (Flexible taking remaining space, Max width ~900px, centered if screen very wide)
        Right Side: Accordion Panel (Fixed ~400px)
      */}
      
      {/* Main Center (Chat) */}
      <main className="flex-1 flex flex-col h-full bg-background relative w-full border-r border-transparent lg:border-border shadow-sm max-w-5xl mx-auto">
        {/* Header */}
        <header className="h-16 shrink-0 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-9 h-9 rounded-full bg-pikmin-cream shadow-card flex items-center justify-center text-xs border-[2px] border-primary/20"
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
               咻妮
            </motion.div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold m-0 flex items-center gap-1.5 text-foreground">
                咻妮 🌱
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pikmin-leaf animate-pulse" />
                為 {userProfile?.nickname || '你'} 服務中
              </span>
            </div>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full hover:bg-destructive/10">
            <LogOut size={16} />
          </button>
        </header>

        {/* Dynamic Content (Mobile vs Desktop) */}
        <div className="flex-1 overflow-hidden lg:flex lg:flex-col relative">
          {/* On Mobile: Render Active Tab Content */}
          <div className="block lg:hidden h-full">
            {renderContent()}
          </div>
          
          {/* On Desktop: Always Render Chat in Center Area */}
          <div className="hidden lg:block h-full">
            <ChatArea messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} />
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <nav className="lg:hidden shrink-0 border-t border-border bg-card/80 backdrop-blur-md pb-safe relative">
          
          {/* Floating Quick Action Button on Chat Tab */}
          {mobileTab === 'chat' && (
            <div className="absolute -top-24 right-4 animate-bounce-slow">
              <button 
                onClick={() => setIsExpenseSheetOpen(true)}
                className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 text-white rounded-full font-bold flex items-center gap-2 transition-transform active:scale-95 z-50 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                快速記帳
              </button>
            </div>
          )}

          <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
            <TabItem icon={MessageCircle} label="對話" isActive={mobileTab === 'chat'} onClick={() => setMobileTab('chat')} />
            <TabItem icon={Footprints} label="今日足跡" isActive={mobileTab === 'footprint'} onClick={() => setMobileTab('footprint')} />
            <TabItem icon={Wallet} label="今日花費" isActive={mobileTab === 'expense'} onClick={() => setMobileTab('expense')} />
            <TabItem icon={Compass} label="旅遊規劃" isActive={mobileTab === 'plan'} onClick={() => setMobileTab('plan')} />
          </div>
        </nav>
      </main>

      {/* Right Sidebar: Tabs Panel (Desktop Only) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[450px] lg:shrink-0 bg-muted/10 overflow-hidden shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.05)] z-10 border-l border-border relative">
        {/* Desktop Quick Action Button */}
        <div className="absolute bottom-6 right-6 z-50">
          <button 
            onClick={() => setIsExpenseSheetOpen(true)}
            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 text-white rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            新增花費
          </button>
        </div>

        <RightPanelTabs 
          expenses={expenses} entries={journeyEntries} locations={locations}
          travelPlan={travelPlan} postTripStatus={postTripStatus} phase={phase} onUpdatePlan={handleUpdatePlan}
        />
      </aside>

      {/* Forms & Modals */}
      <ExpenseActionSheet 
        isOpen={isExpenseSheetOpen} 
        onClose={() => setIsExpenseSheetOpen(false)} 
        onSubmit={handleExpenseSubmit!} 
      />
    </div>
  );
}

function TabItem({ icon: Icon, label, isActive, badge, onClick }: any) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center justify-center w-full h-full gap-1 p-2">
      <div className="relative">
        <Icon size={20} className={`${isActive ? 'text-primary' : 'text-muted-foreground'} transition-colors`} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-2 bg-pikmin-sun text-[10px] font-bold text-foreground px-1.5 py-0.5 rounded-full min-w-4 text-center">
            {badge}
          </span>
        )}
      </div>
      <span className={`${isActive ? 'text-[10px] font-medium text-primary' : 'text-[10px] font-medium text-muted-foreground'}`}>{label}</span>
      <AnimatePresence>
        {isActive && (
          <motion.div 
            layoutId="tab-indicator"
            className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-nature rounded-t-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}
