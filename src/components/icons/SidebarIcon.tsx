
export function SidebarIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 48 48" 
      className={className} 
    >
      <path d="M7 4C5.34315 4 4 5.34315 4 7V41C4 42.6569 5.34315 44 7 44H15V4H7Z" fill="currentColor"/>
      <path d="M19 4V44H41C42.6569 44 44 42.6569 44 41V7C44 5.34315 42.6569 4 41 4H19Z" fill="currentColor"/>
    </svg>
  );
}