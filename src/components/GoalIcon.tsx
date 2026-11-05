import {
  BookOpen,
  Coffee,
  Droplet,
  Dumbbell,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  PenLine,
  Pill,
  Sun,
  Target,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '@/theme';

/** 목표 아이콘 키 → 선 아이콘. 저장소에는 키(문자열)만 저장한다. */
export const GOAL_ICONS: Record<string, LucideIcon> = {
  target: Target,
  stretch: Dumbbell,
  walk: Footprints,
  water: Droplet,
  pill: Pill,
  moon: Moon,
  sun: Sun,
  book: BookOpen,
  heart: Heart,
  leaf: Leaf,
  coffee: Coffee,
  music: Music,
  pen: PenLine,
};

export const ICON_KEYS = Object.keys(GOAL_ICONS);

/** 목표 이름으로 어울리는 아이콘을 추측 (사용자가 고르지 않았을 때) */
export function guessIcon(name: string): string {
  const rules: [RegExp, string][] = [
    [/스트레칭|운동|헬스|요가|플랭크|스쿼트/, 'stretch'],
    [/걷|산책|걸음|러닝|달리/, 'walk'],
    [/물|수분/, 'water'],
    [/약|영양제|비타민/, 'pill'],
    [/자기|잠|수면/, 'moon'],
    [/일어나|기상|아침/, 'sun'],
    [/책|독서|읽/, 'book'],
    [/감사|사랑|연락/, 'heart'],
    [/명상|채소|식물/, 'leaf'],
    [/커피|카페인/, 'coffee'],
    [/음악|연습|악기/, 'music'],
    [/쓰기|공부|일기/, 'pen'],
  ];
  return rules.find(([re]) => re.test(name))?.[1] ?? 'target';
}

export function GoalIcon({ icon, size = 20, color = colors.point }: { icon: string; size?: number; color?: string }) {
  const Icon = GOAL_ICONS[icon] ?? Target;
  return <Icon size={size} color={color} strokeWidth={1.8} />;
}
