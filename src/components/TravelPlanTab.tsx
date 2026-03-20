import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Circle, AlertCircle, MapPin, ChevronRight, Gift } from 'lucide-react';
import type { TravelPlan, PostTripStatus } from '../services/ai';

interface Props {
  travelPlan?: TravelPlan;
  postTripStatus?: PostTripStatus;
  phase: 'idle' | 'planning' | 'traveling' | 'post_trip';
}

export default function TravelPlanTab({ travelPlan, postTripStatus, phase }: Props) {
  const [checklist, setChecklist] = useState({
    finance: false,
    transport: false,
    connectivity: false,
    electronics: false,
    clothing: false,
    tickets: false
  });

  const isPreTripDone = Object.values(checklist).every(v => v);

  // Status mapping
  let statusText = '準備規劃中';
  let dateText = '請跟咻妮說您的旅遊檔期';
  
  if (travelPlan) {
    dateText = `${travelPlan.startDate} - ${travelPlan.endDate}`;
    const start = new Date(travelPlan.startDate).getTime();
    const today = new Date().getTime();
    
    if (phase === 'post_trip' || today > new Date(travelPlan.endDate).getTime()) {
      statusText = '旅程已結束';
    } else if (today >= start) {
      statusText = '🌴 旅途中';
    } else {
      const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
      statusText = `⏳ 距離出發還有 ${diffDays} 天`;
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto pb-20">
      
      {/* Dynamic Header */}
      <div className="bg-gradient-nature rounded-2xl p-5 shadow-soft text-primary-foreground relative overflow-hidden flex flex-col gap-1">
        <div className="absolute right-[-10px] top-[-10px] text-5xl opacity-20 pointer-events-none">✈️</div>
        <span className="text-xs font-bold opacity-80 uppercase tracking-widest">旅程規劃</span>
        <h2 className="text-2xl font-display font-bold">{travelPlan?.destination || '尚未設定目的地'}</h2>
        <div className="flex items-center gap-2 mt-2 text-sm bg-black/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
          <Calendar size={14} /> {dateText}
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-pikmin-sun text-pikmin-earth font-bold text-xs px-3 py-1 rounded-full w-fit">
          <AlertCircle size={14} /> {statusText}
        </div>
      </div>

      {/* Pre-Trip Card Advisor */}
      {travelPlan && travelPlan.suggestedCards && travelPlan.suggestedCards.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-md font-bold text-foreground mb-4 flex items-center gap-2">
            💳 專屬神卡推薦
            <span className="text-[10px] bg-pikmin-sun text-pikmin-earth px-2 py-0.5 rounded-full ml-auto">咻妮精選</span>
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {travelPlan.suggestedCards.map((card, idx) => (
              <div key={idx} className="shrink-0 w-[240px] snap-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-xl pointer-events-none" />
                 <span className="text-[10px] font-bold text-primary tracking-wider">{card.bank}</span>
                 <h4 className="text-sm font-bold text-foreground">{card.cardName}</h4>
                 <div className="text-xs text-pikmin-leaf-dark bg-pikmin-leaf/20 border border-pikmin-leaf/30 px-2 py-1 rounded-md w-fit font-medium mt-1">
                   {card.rewardRate}
                 </div>
                 <div className="flex gap-2 mt-3 pt-3 border-t border-primary/10">
                   <button className="flex-1 text-[10px] font-bold bg-primary hover:bg-primary-dark text-primary-foreground py-1.5 rounded-lg active:scale-95 transition-all shadow-sm">
                     加入旅程錢包
                   </button>
                   <a href={card.applyUrl} target="_blank" rel="noreferrer" className="flex-1 text-[10px] font-bold bg-background hover:bg-muted text-foreground border border-border py-1.5 rounded-lg text-center active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm">
                     線上申辦 <ChevronRight size={10} />
                   </a>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-Trip Checklist */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-md font-bold text-foreground mb-4 flex items-center gap-2">
          📝 行前準備清單
        </h3>
        
        {isPreTripDone ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center p-6 bg-pikmin-leaf/10 rounded-xl border border-pikmin-leaf/30 text-center gap-2">
            <span className="text-4xl">🎉</span>
            <p className="font-bold text-primary text-lg">完成啦！</p>
            <p className="text-sm text-muted-foreground">行前準備都搞定了，咻妮隨時準備出發！</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            <CheckItem id="finance" label="核心證件與財務" items={travelPlan?.checklist?.finance} checked={checklist.finance} onChange={(v) => setChecklist(p => ({...p, finance: v}))} />
            <CheckItem id="transport" label="交通與住宿憑證" items={travelPlan?.checklist?.transport} checked={checklist.transport} onChange={(v) => setChecklist(p => ({...p, transport: v}))} />
            <CheckItem id="connectivity" label="網路與通訊" items={travelPlan?.checklist?.connectivity} checked={checklist.connectivity} onChange={(v) => setChecklist(p => ({...p, connectivity: v}))} />
            <CheckItem id="electronics" label="攝影與電子設備" items={travelPlan?.checklist?.electronics} checked={checklist.electronics} onChange={(v) => setChecklist(p => ({...p, electronics: v}))} />
            <CheckItem id="clothing" label="衣物與個人日用品" items={travelPlan?.checklist?.clothing} checked={checklist.clothing} onChange={(v) => setChecklist(p => ({...p, clothing: v}))} />
            <CheckItem id="tickets" label="行程與活動票券" items={travelPlan?.checklist?.tickets} checked={checklist.tickets} onChange={(v) => setChecklist(p => ({...p, tickets: v}))} />
            <p className="text-[10px] text-muted-foreground text-center mt-2">跟咻妮對話請他幫你規劃時，這裡會自動產生詳細項目喔！</p>
          </div>
        )}
      </div>

      {/* Itinerary */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-md font-bold text-foreground mb-4 flex items-center gap-2">
          🗺️ 預計行程安排
        </h3>
        { travelPlan && travelPlan.itinerary?.length > 0 ? (
          <div className="flex flex-col gap-6">
            {travelPlan.itinerary.map((day, idx) => {
              const isToday = day.date === new Date().toISOString().split('T')[0];
              return (
                <div key={idx} className={`relative pl-4 border-l-2 ${isToday ? 'border-primary' : 'border-primary/20'}`}>
                  <div className={`absolute -left-2 top-0 w-3.5 h-3.5 rounded-full border-4 border-background ${isToday ? 'bg-pikmin-sun' : 'bg-primary'}`} />
                  <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    Day {day.dayIndex} <span className="text-xs font-normal opacity-70">({day.date})</span>
                    {isToday && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-auto shadow-sm">📍 今日行程</span>}
                  </h4>
                  <div className="flex flex-col gap-3">
                    {day.activities.map((act, i) => (
                      <div key={i} className={`flex gap-3 items-start p-3 rounded-lg border ${isToday ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-border'}`}>
                        <div className="text-xs font-medium text-muted-foreground w-10 shrink-0 mt-0.5">{act.time}</div>
                        <div className="flex flex-col gap-1">
                          <span className={`text-sm font-bold ${isToday ? 'text-primary-dark' : 'text-foreground'}`}>{act.title}</span>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin size={10} /> {act.location}
                          </div>
                          
                          {/* Coupons and Best Card Tags */}
                          {(act.matchingCoupon || act.recommendedCard) && (
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {act.recommendedCard && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  💳 刷 {act.recommendedCard}
                                </span>
                              )}
                              {act.matchingCoupon && (
                                <button className="text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1 active:scale-95 transition-colors">
                                  <Gift size={10} /> {act.matchingCoupon.title} ({act.matchingCoupon.discount})
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center p-8 bg-muted/30 rounded-lg dashed-border">
            請在左側對話框輸入「幫我規劃...」，咻妮就會幫你排好五天豐富行程啦！🚀
          </div>
        )}
      </div>

      {/* Post-Trip Checklist */}
      <div className={`bg-card border border-border rounded-xl p-5 shadow-sm transition-all ${phase === 'post_trip' || phase === 'idle' && postTripStatus ? 'opacity-100 grayscale-0 border-pikmin-sun/30' : 'opacity-60 grayscale-[50%]'}`}>
        <h3 className="text-md font-bold text-foreground mb-4 flex items-center gap-2">
          📸 玩完後大盤點
        </h3>
        
        {postTripStatus ? (
           <div className="flex flex-col gap-4">
              <div className="flex gap-2 p-3 bg-pikmin-leaf/10 text-pikmin-leaf-dark rounded-lg text-xs leading-relaxed">
                 <strong className="shrink-0 tracking-widest text-pikmin-earth bg-pikmin-sun/30 px-2 py-0.5 rounded mr-1">咻妮短評</strong>
                 {postTripStatus.reviewText}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 size={18} className="text-primary"/> 財務結算與記帳收尾</div>
                <div className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 size={18} className="text-primary"/> 足跡成就解鎖 (生成回憶地圖)</div>
                <div className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 size={18} className="text-primary"/> 裝備歸位與實體整理</div>
                <div className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 size={18} className="text-primary"/> 評價與遊記產出</div>
              </div>
           </div>
        ) : (
          <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground"><Circle size={18} /> 財務結算與記帳收尾</div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground"><Circle size={18} /> 足跡成就解鎖 (最終地圖)</div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground"><Circle size={18} /> 裝備歸位與實體整理</div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground"><Circle size={18} /> 評價與遊記產出</div>
          </div>
        )}

        {!postTripStatus && (
          <p className="text-[10px] mt-4 text-center text-muted-foreground">旅程結束後向咻妮報告「玩完了！」，就能在這裡解鎖成就拿專屬旅記喔！</p>
        )}
      </div>

    </div>
  );
}

function CheckItem({ label, items, checked, onChange }: { id: string, label: string, items?: string[], checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className={`flex flex-col rounded-lg border transition-all ${checked ? 'bg-pikmin-leaf/5 border-pikmin-leaf/30' : 'bg-background hover:bg-muted/50 border-transparent hover:border-border'}`}>
      <button 
        onClick={() => onChange(!checked)}
        className="flex items-center gap-3 p-3 w-full text-left"
      >
        {checked ? <CheckCircle2 size={20} className="text-primary shrink-0" /> : <Circle size={20} className="text-muted-foreground shrink-0" />}
        <span className={`text-sm font-medium ${checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{label}</span>
        {checked && <span className="ml-auto text-xs text-primary font-bold shrink-0">Done!</span>}
      </button>
      
      {/* Sub-items generated by AI */}
      {items && items.length > 0 && !checked && (
        <div className="px-10 pb-3 flex flex-wrap gap-1.5">
          {items.slice(0, 3).map((item, i) => (
            <span key={i} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md leading-tight">{item}</span>
          ))}
          {items.length > 3 && <span className="text-[10px] bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md">+{items.length - 3} 更多</span>}
        </div>
      )}
    </div>
  );
}
