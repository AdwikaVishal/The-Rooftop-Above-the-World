export type StoryTheme = 'loneliness' | 'friendship' | 'change' | 'hard-days' | 'hope';

export interface StoryDefinition {
  id: string;
  theme: StoryTheme;
  title: string;
  body: string;
}

export const STORY_THEMES: readonly { id: StoryTheme; label: string }[] = [
  { id: 'loneliness', label: 'Loneliness' },
  { id: 'friendship', label: 'Friendship' },
  { id: 'change', label: 'Change' },
  { id: 'hard-days', label: 'Difficult days' },
  { id: 'hope', label: 'Hope' },
];

export const STORIES: readonly StoryDefinition[] = [
  {
    id: 'the-light-left-on',
    theme: 'loneliness',
    title: 'The light left on',
    body:
      'My flatmate moved out in spring. For weeks I came home to a dark hallway and stood there a little too long. One night I started leaving the little lamp above the stove on before I went out. Nobody was waiting for me. But the room said welcome back anyway, and that turned out to be something.',
  },
  {
    id: 'two-cups',
    theme: 'friendship',
    title: 'Two cups',
    body:
      'We were never good at long phone calls. So every Sunday we made tea at the same time, in different cities, and sent one photograph of the cup. No caption. It lasted almost a year. I still make tea at four o\'clock sometimes and think of her kitchen light.',
  },
  {
    id: 'the-slow-tuesday',
    theme: 'change',
    title: 'The slow Tuesday',
    body:
      'Nothing dramatic happened the day I started to feel like myself again. I bought oranges. I answered a message. I walked the long way home because the evening was warm. Small things, mostly. It was not a beginning, exactly. More like noticing that the ground had quietly returned beneath my feet.',
  },
  {
    id: 'not-a-burden',
    theme: 'hard-days',
    title: 'Not a burden',
    body:
      'A friend once told me she would rather sit with me in a hard hour than hear about it a month later. I had been trying to spare her. It had never occurred to me that being allowed in could be a kind of gift. I try to remember that now, when someone else is quiet.',
  },
  {
    id: 'the-plant-i-did-not-kill',
    theme: 'hope',
    title: 'The plant I did not kill',
    body:
      'It lost all but two leaves. I kept watering it out of habit, mostly because throwing it away felt like admitting something. In February a new leaf came, small and ridiculous and bright. I do not think it meant my whole life was fixed. I think it meant a plant can be nearly gone and still decide to try again.',
  },
  {
    id: 'the-friend-who-asks-twice',
    theme: 'friendship',
    title: 'The friend who asks twice',
    body:
      'I have a friend who never believes the first "I\'m fine." She does not push. She just asks again later, in a softer way, and then lets me decide. The second ask is where most of our real conversations begin. I have started learning to ask twice, too.',
  },
  {
    id: 'the-long-way-home',
    theme: 'loneliness',
    title: 'The long way home',
    body:
      'Some nights I took the bus that went past the river instead of the one that went straight home. It added twenty minutes and a view of the lights on the water. I think I needed the twenty minutes. I think I needed to be a person moving through a city, not just a person arriving somewhere empty.',
  },
  {
    id: 'a-different-shape',
    theme: 'change',
    title: 'A different shape',
    body:
      'I used to measure myself against the person I was before. More energy, more plans, more sure. Someone asked me once whether the old version of me could have sat with the new one without trying to fix her. It is a strange question. I am still working on an answer, but I think I would like to try.',
  },
  {
    id: 'the-message-i-kept',
    theme: 'hard-days',
    title: 'The message I kept',
    body:
      'In the middle of a bad week, a friend sent me a photograph of a terrible dog in a raincoat. No advice. Nothing to reply to. I laughed for the first time in days. I still have the photograph. Sometimes help arrives in a shape so small you almost miss it.',
  },
  {
    id: 'the-window-seat',
    theme: 'hope',
    title: 'The window seat',
    body:
      'On the train home I sat beside a woman who was knitting a sleeve in the same soft green as my grandmother\'s cardigan. We did not speak. Somewhere past the fields, the sun came out. I do not know why I remember this so clearly. Some moments just agree to hold you for a while.',
  },
];
