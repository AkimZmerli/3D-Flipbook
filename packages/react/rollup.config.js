import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default [
  // Main build
  {
    input: 'src/index.ts',
    external: ['react', 'react-dom', '@3d-flipbook/core'],
    output: [
      {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true
      }
    ],
    plugins: [
      peerDepsExternal(),
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        declaration: true,
        declarationDir: 'dist/types'
      })
    ]
  },
  // Type definitions
  {
    input: 'dist/types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    plugins: [dts()],
    external: ['react', 'react-dom', '@3d-flipbook/core']
  }
];