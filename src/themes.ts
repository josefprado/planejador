export interface Theme {
  id: string;
  name: string;
  preview: string;
  background: string;
  fontClass: string;
  textColor: string;
  blockClass: string;
}

export const THEMES: Theme[] = [
  {
    id: 'magic-kingdom',
    name: 'Reino Mágico',
    preview: 'https://images.unsplash.com/photo-1596482253192-d965d1dbb3c2?w=400&h=300&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1596482253192-d965d1dbb3c2?w=1920&h=1080&fit=crop&q=80',
    fontClass: 'font-playfair',
    textColor: 'text-white',
    blockClass: 'bg-blue-900/40 border-2 border-yellow-300/50 rounded-lg shadow-lg shadow-yellow-300/10 backdrop-blur-sm',
  },
  {
    id: 'future-world',
    name: 'Mundo Futurista',
    preview: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?w=400&h=300&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?w=1920&h=1080&fit=crop&q=80',
    fontClass: 'font-orbitron',
    textColor: 'text-cyan-300',
    blockClass: 'bg-black/50 border border-cyan-400/50 rounded-none shadow-lg shadow-cyan-400/20 backdrop-blur-md',
  },
  {
    id: 'hollywood-studios',
    name: 'Estúdios de Cinema',
    preview: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop&q=80',
    fontClass: 'font-oswald',
    textColor: 'text-amber-100',
    blockClass: 'bg-red-900/60 border-t-4 border-b-4 border-yellow-500 rounded-md shadow-2xl shadow-black/50 backdrop-blur-sm',
  },
  {
    id: 'savanna-adventure',
    name: 'Aventura na Savana',
    preview: 'https://images.unsplash.com/photo-1517483849154-ba5f7457e4e1?w=400&h=300&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1517483849154-ba5f7457e4e1?w=1920&h=1080&fit=crop&q=80',
    fontClass: 'font-anton tracking-wide',
    textColor: 'text-yellow-100',
    blockClass: 'bg-orange-900/50 border-4 border-orange-400/80 rounded-full shadow-lg shadow-black/40 backdrop-blur-sm',
  },
  {
    id: 'paradise-beach',
    name: 'Praia Paradisíaca',
    preview: 'https://images.unsplash.com/photo-1507525428034-b723a996f6ea?w=400&h=300&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1507525428034-b723a996f6ea?w=1920&h=1080&fit=crop&q=80',
    fontClass: 'font-dancing font-bold',
    textColor: 'text-slate-800',
    blockClass: 'bg-white/50 border border-white/60 rounded-lg shadow-lg backdrop-blur-sm text-cyan-800',
  },
  {
    id: 'zen-garden',
    name: 'Jardim Zen Oriental',
    preview: 'https://images.unsplash.com/photo-1440688807730-97e4ac9096b2?w=400&h=300&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1440688807730-97e4ac9096b2?w=1920&h=1080&fit=crop&q=80',
    fontClass: 'font-notojp',
    textColor: 'text-white',
    blockClass: 'bg-black/30 border-t-2 border-b-2 border-red-400/80 rounded-none shadow-md text-white',
  },
  {
    id: 'night-city',
    name: 'Metrópole Noturna',
    preview: 'https://images.unsplash.com/photo-1519120126536-6b61f8c14682?w=400&h=300&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1519120126536-6b61f8c14682?w=1920&h=1080&fit=crop&q=80',
    fontClass: 'font-montserrat font-black',
    textColor: 'text-fuchsia-300',
    blockClass: 'bg-transparent border border-fuchsia-400/70 rounded-lg shadow-lg shadow-fuchsia-500/30 text-fuchsia-300',
  },
  {
    id: 'snowy-adventure',
    name: 'Aventura Nevada',
    preview: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=400&h=300&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=1920&h=1080&fit=crop&q=80',
    fontClass: 'font-lato font-black',
    textColor: 'text-gray-800',
    blockClass: 'bg-white/60 backdrop-blur-md rounded-xl shadow-lg border border-white/20 text-blue-900',
  }
];
