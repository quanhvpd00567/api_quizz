import { configApp } from '@adonisjs/eslint-config'

export default configApp({
  rules: {
    // Disable naming convention rule to allow flexible interface naming (IInterface, etc.)
    '@typescript-eslint/naming-convention': 'off',
    
    // Disable filename case rule to allow PascalCase filenames (Quiz.ts, User.ts, etc.)
    '@unicorn/filename-case': 'off',
  },
})
