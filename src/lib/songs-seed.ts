// NOTE: Audio files at /audio/songs/*.mp3 are not yet generated.
// Lyric sync will work once files are added. Components handle missing
// audio gracefully via Howler's loaderror event.

import type { Song } from '@/types';

export const SONGS_SEED: Song[] = [
  {
    id: 'song-twinkle',
    title: 'Twinkle Twinkle Little Star',
    titleZh: '小星星',
    audioPath: '/audio/songs/twinkle.mp3',
    coverImagePath: '/images/vocabulary/star.png',
    playCount: 0,
    lyrics: [
      {
        startMs: 0,
        endMs: 4000,
        text: 'Twinkle, twinkle, little star',
        textZh: '一闪一闪，小星星',
        highlightWordIds: ['object-star'],
      },
      {
        startMs: 4000,
        endMs: 8000,
        text: 'How I wonder what you are',
        textZh: '我多想知道你是什么',
        highlightWordIds: [],
      },
      {
        startMs: 8000,
        endMs: 12000,
        text: 'Up above the world so high',
        textZh: '高悬于世界之上',
        highlightWordIds: ['object-moon'],
      },
      {
        startMs: 12000,
        endMs: 16000,
        text: 'Like a diamond in the sky',
        textZh: '像天上的钻石',
        highlightWordIds: ['object-star'],
      },
      {
        startMs: 16000,
        endMs: 20000,
        text: 'Twinkle, twinkle, little star',
        textZh: '一闪一闪，小星星',
        highlightWordIds: ['object-star'],
      },
      {
        startMs: 20000,
        endMs: 24000,
        text: 'How I wonder what you are',
        textZh: '我多想知道你是什么',
        highlightWordIds: [],
      },
    ],
  },
  {
    id: 'song-old-macdonald',
    title: 'Old MacDonald Had a Farm',
    titleZh: '老麦克唐纳有个农场',
    audioPath: '/audio/songs/old-macdonald.mp3',
    coverImagePath: '/images/vocabulary/cow.png',
    playCount: 0,
    lyrics: [
      {
        startMs: 0,
        endMs: 4000,
        text: 'Old MacDonald had a farm',
        textZh: '老麦克唐纳有个农场',
        highlightWordIds: [],
      },
      {
        startMs: 4000,
        endMs: 8000,
        text: 'E-I-E-I-O',
        textZh: '哎呀哎呀哦',
        highlightWordIds: [],
      },
      {
        startMs: 8000,
        endMs: 12000,
        text: 'And on his farm he had a cow',
        textZh: '农场里有一头牛',
        highlightWordIds: ['animal-cow'],
      },
      {
        startMs: 12000,
        endMs: 16000,
        text: 'E-I-E-I-O',
        textZh: '哎呀哎呀哦',
        highlightWordIds: [],
      },
      {
        startMs: 16000,
        endMs: 20000,
        text: 'With a moo moo here, and a duck quack there',
        textZh: '这里哞哞，那里嘎嘎',
        highlightWordIds: ['animal-duck'],
      },
      {
        startMs: 20000,
        endMs: 24000,
        text: 'Old MacDonald had a farm',
        textZh: '老麦克唐纳有个农场',
        highlightWordIds: ['animal-cow'],
      },
    ],
  },
  {
    id: 'song-head-shoulders',
    title: 'Head Shoulders Knees and Toes',
    titleZh: '头肩膀膝盖脚趾',
    audioPath: '/audio/songs/head-shoulders.mp3',
    coverImagePath: '/images/vocabulary/head.png',
    playCount: 0,
    lyrics: [
      {
        startMs: 0,
        endMs: 4000,
        text: 'Head, shoulders, knees and toes',
        textZh: '头，肩膀，膝盖和脚趾',
        highlightWordIds: ['body-head'],
      },
      {
        startMs: 4000,
        endMs: 8000,
        text: 'Knees and toes',
        textZh: '膝盖和脚趾',
        highlightWordIds: [],
      },
      {
        startMs: 8000,
        endMs: 12000,
        text: 'Head, shoulders, knees and toes',
        textZh: '头，肩膀，膝盖和脚趾',
        highlightWordIds: ['body-head'],
      },
      {
        startMs: 12000,
        endMs: 16000,
        text: 'Knees and toes',
        textZh: '膝盖和脚趾',
        highlightWordIds: [],
      },
      {
        startMs: 16000,
        endMs: 20000,
        text: 'Eyes and ears and mouth and nose',
        textZh: '眼睛、耳朵、嘴巴和鼻子',
        highlightWordIds: ['body-eyes', 'body-ears', 'body-nose'],
      },
      {
        startMs: 20000,
        endMs: 24000,
        text: 'Head, shoulders, knees and toes',
        textZh: '头，肩膀，膝盖和脚趾',
        highlightWordIds: ['body-head'],
      },
    ],
  },
];
