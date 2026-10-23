import next from 'eslint-config-next/core-web-vitals';
export default [...next, { ignores: ['.next/**', 'node_modules/**'] }, { rules: { 'react/no-unescaped-entities': 'off', 'react-hooks/set-state-in-effect': 'off', 'react-hooks/refs': 'off', 'react-hooks/purity': 'off' } }];
