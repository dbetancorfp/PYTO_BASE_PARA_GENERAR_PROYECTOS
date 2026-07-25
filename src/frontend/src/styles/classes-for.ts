// Single source of truth for `type x variant x size -> Tailwind classes`.
// Components never inline their own `if (variant === ...)` logic — see
// tecnologias/tecnologia_ux.md and CLAUDE.md "Visual style" section.

export type ComponentType =
  | 'heading'
  | 'text-input'
  | 'password-input'
  | 'icon-button'
  | 'submit-button'
  | 'link'
  | 'paragraph';

export type ComponentVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'default';

export type ComponentSize = 'sm' | 'md' | 'lg';

const SIZE_TEXT: Record<ComponentSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const SIZE_PADDING: Record<ComponentSize, string> = {
  sm: 'px-2 py-1',
  md: 'px-4 py-2',
  lg: 'px-6 py-3',
};

const INPUT_BASE =
  'block w-full rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-offset-0';

const INPUT_VARIANT: Record<'default' | 'danger', string> = {
  default: 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500',
  danger: 'border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500',
};

const BUTTON_VARIANT: Record<ComponentVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100',
  link: 'bg-transparent text-blue-600 underline hover:text-blue-800',
  default: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
};

/**
 * Maps a ui-spec.json `type` (+ optional `variant`/`size`) to the Tailwind classes to apply
 * to that element. Never branch on `variant` inside a component — extend this table instead.
 */
export function classesFor(
  type: ComponentType,
  variant: ComponentVariant = 'default',
  size: ComponentSize = 'md',
): string {
  switch (type) {
    case 'heading':
      return 'text-2xl font-bold text-gray-900';
    case 'text-input':
    case 'password-input': {
      const inputVariant = variant === 'danger' ? INPUT_VARIANT.danger : INPUT_VARIANT.default;
      return `${INPUT_BASE} ${SIZE_PADDING[size]} ${SIZE_TEXT[size]} ${inputVariant}`;
    }
    case 'icon-button':
      return `inline-flex items-center justify-center rounded-full ${SIZE_PADDING[size]} ${BUTTON_VARIANT[variant]}`;
    case 'submit-button':
      return `w-full rounded-md font-semibold ${SIZE_PADDING[size]} ${SIZE_TEXT[size]} ${BUTTON_VARIANT[variant]}`;
    case 'link':
      return 'text-sm underline hover:text-blue-800 text-blue-600';
    case 'paragraph':
      return variant === 'danger' ? 'text-sm text-red-600' : 'text-sm text-gray-700';
  }
}
