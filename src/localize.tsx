import React from 'react';
import { getCurrentLanguage, translate } from './i18n.ts';

/** Translate existing JSX text and accessibility labels at render time. */
export function localize(node: React.ReactNode): React.ReactNode {
  const language = getCurrentLanguage();
  const visit = (value: React.ReactNode): React.ReactNode => {
    if (typeof value === 'string') return translate(value, language);
    if (Array.isArray(value)) return React.Children.toArray(value).map(visit);
    if (!React.isValidElement(value)) return value;
    const props = value.props as Record<string, unknown>;
    const changed: Record<string, unknown> = {};
    for (const key of ['title', 'aria-label', 'alt', 'placeholder']) {
      if (typeof props[key] === 'string') changed[key] = translate(props[key] as string, language);
    }
    if ('children' in props) changed.children = visit(props.children as React.ReactNode);
    return React.cloneElement(value, changed);
  };
  return visit(node);
}
