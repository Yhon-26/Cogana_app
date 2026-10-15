const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expo,
  { ignores: ['dist/**', '.expo/**', 'tools/**', 'design/**', 'src/types/database.generated.ts'] },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/supabase-js', '@/services/supabase/client'],
              message:
                'Accede a datos mediante servicios de dominio; no desde rutas o componentes.',
            },
          ],
        },
      ],
    },
  },
]);
