import type { Song } from '@/types';

export const SONGS_SEED: Song[] = [
  {
    id: 'song-animals',
    title: 'Animal Friends',
    titleZh: '动物朋友',
    audioPath: '/audio/songs/animal-friends.mp3',
    coverImagePath: '/images/songs/animal-friends.png',
    lyrics: [
      {
        text: 'The cat says meow',
        textZh: '猫咪说喵喵',
        startMs: 0,
        endMs: 2000,
        highlightWordIds: ['animal-cat'],
      },
      {
        text: 'The dog says woof',
        textZh: '小狗说汪汪',
        startMs: 2000,
        endMs: 4000,
        highlightWordIds: ['animal-dog'],
      },
    ],
  },
];
