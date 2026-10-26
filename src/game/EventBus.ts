import type {
  CatReactionId,
  HiddenId,
  PlantId,
  SceneState,
} from '../types/world';

export interface GameEvents {
  'game:ready': undefined;
  'game:cat-petted': { reaction: CatReactionId };
  'game:plant-touched': { plant: PlantId };
  'game:hidden-found': { id: HiddenId };
  'game:moon-clicked': undefined;
  'game:firefly-caught': undefined;
  'game:telescope-open': undefined;
  'game:lights-request': undefined;
  'app:sync': SceneState;
  'app:reduced-motion': boolean;
}

class TypedEventBus<Events> {
  private readonly target = new EventTarget();

  on<K extends keyof Events & string>(
    event: K,
    handler: (payload: Events[K]) => void,
  ): () => void {
    const listener = (nativeEvent: Event): void => {
      handler((nativeEvent as CustomEvent<Events[K]>).detail);
    };
    this.target.addEventListener(event, listener);
    return () => this.target.removeEventListener(event, listener);
  }

  emit<K extends keyof Events & string>(event: K, payload: Events[K]): void {
    this.target.dispatchEvent(new CustomEvent<Events[K]>(event, { detail: payload }));
  }
}

export const gameEvents = new TypedEventBus<GameEvents>();
