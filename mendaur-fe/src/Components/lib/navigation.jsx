import {
  Home,
  User,
  Recycle,
  Package,
  ShoppingBag,
  History,
  Trophy,
  LogOut,
} from "lucide-react";

export const Sidebarlinks = [
  {
    key: 'beranda',
    label: 'Beranda',
    path: '/dashboard',
    icon: <Home/>
  },

  {
    key: 'profil',
    label: 'Profil',
    path: '/dashboard/profil',
    icon: <User/>
  },

  {
    key: 'tabungSampah',
    label: 'Tabung Sampah',
    path: '/dashboard/tabungSampah',
    icon: <Recycle/>
  },

  {
    key: 'tukarPoin',
    label: 'Tukar Poin',
    path: '/dashboard/tukarPoin',
    icon: <Package/>
  },

  // {
  //   key: 'produk',
  //   label: 'Produk',
  //   path: '/dashboard/produk',
  //   icon: <ShoppingBag/>
  // },

  {
    key: 'riwayat',
    label: 'Riwayat',
    path: '/dashboard/riwayatTransaksi',
    icon: <History/>
  },

  {
    key: 'leaderboard',
    label: 'Leaderboard',
    path: '/dashboard/leaderboard',
    icon: <Trophy/>
  },
];

export const SidebarBottomlinks = [
  {
    key: 'logout',
    label: 'Keluar',
    path: '/login',
    icon: <LogOut/>
  },
];
