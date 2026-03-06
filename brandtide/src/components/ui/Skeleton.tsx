export default function Skeleton({className}:{className?:string}){
  return <div className={`animate-pulse bg-white/10 rounded-xl ${className||'h-6 w-full'}`}></div>
}
