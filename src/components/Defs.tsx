
import React from 'react';
import { SVG_DEFS } from '../utils/svgDefs';

/**
 * SVG Definitions for patterns, gradients, and filters.
 * These are referenced by ID in the fill/stroke attributes.
 */
export const Defs: React.FC = () => {
    return (
        <defs dangerouslySetInnerHTML={{ __html: SVG_DEFS }} />
    );
};
