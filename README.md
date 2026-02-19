# Another Pihole Dashboard

## Key differences vs official dashboard
1. Clicking on top domain shows stats for top clients querying that domain (Pic 2).
2. CLicking on top client shows stats on top domain queryied by that client (Pic 3).

<img width="1512" height="836" alt="Screenshot 2026-02-18 at 11 50 18 PM" src="https://github.com/user-attachments/assets/385ee67c-5609-43f4-84f7-bc8d03f1610b" />
<img width="1512" height="836" alt="Screenshot 2026-02-18 at 11 50 59 PM" src="https://github.com/user-attachments/assets/5d62c3ac-0697-48c1-a270-5d1b75eba632" />
<img width="1512" height="836" alt="Screenshot 2026-02-18 at 11 52 35 PM" src="https://github.com/user-attachments/assets/537dd325-e0d2-400f-875f-05ba0d735ea4" />


## Instructions to run and develop

1. Rename `example.env` to `.env`.
2. Update `VITE_PORT` and `PIHOLE` in `.env` if required.
3.

```
   cd another-pihole-dashboard
   npm install
   npm run dev
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			// Other configs...

			// Remove tseslint.configs.recommended and replace with this
			tseslint.configs.recommendedTypeChecked,
			// Alternatively, use this for stricter rules
			tseslint.configs.strictTypeChecked,
			// Optionally, add this for stylistic rules
			tseslint.configs.stylisticTypeChecked,

			// Other configs...
		],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.node.json', './tsconfig.app.json'],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			// Other configs...
			// Enable lint rules for React
			reactX.configs['recommended-typescript'],
			// Enable lint rules for React DOM
			reactDom.configs.recommended,
		],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.node.json', './tsconfig.app.json'],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```
