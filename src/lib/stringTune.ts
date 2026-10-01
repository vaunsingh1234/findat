import {
  StringTune,
  StringProgress,
  StringParallax,
  StringCursor,
  StringSpotlight,
  StringMagnetic,
  StringScroller,
  StringProgressPart,
} from '@fiddle-digital/string-tune';

let stringTuneInstance: StringTune | null = null;
let isInitialized = false;

export function initStringTune(): StringTune | null {
  if (typeof window === 'undefined') return null;
  if (isInitialized && stringTuneInstance) return stringTuneInstance;

  try {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st = StringTune.getInstance();

    // Register StringTune modular components
    st.use(StringProgress);
    st.use(StringParallax);
    st.use(StringSpotlight);
    st.use(StringMagnetic);
    st.use(StringScroller);
    st.use(StringProgressPart);

    if (!prefersReducedMotion) {
      st.use(StringCursor);
      // Configure smooth scroll settings
      st.scrollDesktopMode = 'smooth';
      st.scrollMobileMode = 'default';
      st.speed = 0.85;
      st.speedAccelerate = 0.25;
    } else {
      st.scrollDesktopMode = 'default';
      st.scrollMobileMode = 'default';
    }

    // Start StringTune engine loop at 60fps
    st.start(60);

    stringTuneInstance = st;
    isInitialized = true;
    console.log('[FinDat] StringTune initialized successfully with attribute-driven modules.');
    return st;
  } catch (error) {
    console.warn('[FinDat] StringTune initialization fallback (running with native scroll):', error);
    return null;
  }
}

export function getStringTune(): StringTune | null {
  return stringTuneInstance;
}
