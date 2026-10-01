import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    string?: string | boolean;
    'string-id'?: string;
    'string-parallax'?: string | number;
    'string-cursor'?: string | boolean;
    'string-cursor-class'?: string;
    'string-outside-container'?: string | boolean;
    'string-part-of'?: string;
    'string-copy-from'?: string;
    'string-exit-vp'?: string;
    'string-exit-el'?: string;
    'string-offset-top'?: string;
    'string-self-disable'?: boolean | string;
    'string-repeat'?: boolean | string;
  }
}
