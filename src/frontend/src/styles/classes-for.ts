// Single source of truth for the design system (see tecnologias/tecnologia_ux.md). No
// component may contain its own `if (variant === '...')` styling logic — they all call
// `classesFor(type, variant, size)`. Adding a new element `type` means adding an entry to
// the tables below, never adding a branch to the function itself (OCP).

// Mirrors `ComponentType` from lib/schemas/ui-spec.schema.js. Duplicated here, rather than
// imported, so that frontend bundles never pull in the pipeline's Zod validation schemas
// (SRP: this module's only job is view→Tailwind-class mapping).
export type ElementType =
  | 'button' | 'submit-button' | 'icon-button'
  | 'text-input' | 'password-input' | 'number-input'
  | 'select' | 'checkbox' | 'textarea'
  | 'table' | 'table-header-cell' | 'table-data-cell'
  | 'table-editable-cell' | 'table-selectable-cell'
  | 'modal' | 'form' | 'nav' | 'tab' | 'tab-group'
  | 'reactive-filter'
  | 'paragraph' | 'heading' | 'image' | 'icon'
  | 'list' | 'card' | 'badge' | 'link'
  | 'dropdown' | 'file-upload'
  | 'container' | 'section';

// Closed vocabulary, copied from `PropsSchema.variant` in lib/schemas/ui-spec.schema.js.
export type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';

export type Size = 'sm' | 'md' | 'lg';

type ClassTable = Partial<Record<ElementType, string>>;
type VariantClassTable = Partial<Record<ElementType, Partial<Record<Variant, string>>>>;
type SizeClassTable = Partial<Record<ElementType, Partial<Record<Size, string>>>>;

// Base classes: always applied for that type, regardless of variant/size.
const BASE_CLASSES: ClassTable = {
  heading: 'font-bold text-slate-900 text-xl',
  'text-input': 'block w-full rounded-md border bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
  'password-input': 'block w-full rounded-md border bg-white px-3 py-2 pr-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
  'icon-button': 'inline-flex items-center justify-center rounded-md focus:outline-none focus:ring-2',
  'submit-button': 'inline-flex w-full items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
  link: 'text-sm text-indigo-600 underline underline-offset-2 hover:text-indigo-800 hover:no-underline',
  paragraph: 'text-sm',
};

// Neutral (no-variant) appearance — used when the caller passes `undefined` for `variant`.
const NEUTRAL_CLASSES: ClassTable = {
  'text-input': 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500',
  'password-input': 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500',
};

// Variant-specific overrides, only for the (type, variant) combinations actually in use.
const VARIANT_CLASSES: VariantClassTable = {
  'text-input': { danger: 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500' },
  'password-input': { danger: 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500' },
  'icon-button': { ghost: 'bg-transparent text-slate-500 hover:bg-slate-100' },
  'submit-button': { primary: 'bg-indigo-600 text-white hover:bg-indigo-700' },
  paragraph: { danger: 'font-medium text-red-600' },
};

const SIZE_CLASSES: SizeClassTable = {
  'icon-button': { sm: 'h-8 w-8 text-sm', md: 'h-10 w-10 text-base', lg: 'h-12 w-12 text-lg' },
  'submit-button': { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-base' },
};

/**
 * `type × variant × size → Tailwind classes`. `type`/`variant`/`size` come straight from
 * the `elementId`'s entry in `ui-spec.json` (or, for state-driven variants like a field
 * turning invalid, the equivalent value computed at render time — never a new vocabulary).
 */
export function classesFor(type: ElementType, variant?: Variant, size: Size = 'md'): string {
  const base = BASE_CLASSES[type] ?? '';
  const variantClasses = variant ? VARIANT_CLASSES[type]?.[variant] ?? '' : NEUTRAL_CLASSES[type] ?? '';
  const sizeClasses = SIZE_CLASSES[type]?.[size] ?? '';
  return [base, variantClasses, sizeClasses].filter((classNames) => classNames.length > 0).join(' ');
}
