import React from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<App />);
    expect(container.innerHTML).toBeDefined();
    root.unmount();
    document.body.removeChild(container);
  });
});

