import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import postcss from 'rollup-plugin-postcss';

const external = ['three', 'gsap'];

export default [
  // Main build
  {
    input: 'src/index.ts',
    external,
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
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        declaration: true,
        declarationDir: 'dist/types'
      }),
      postcss({
        extract: 'styles.css',
        minimize: true,
        sourceMap: true
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
    external: [...external, /\.css$/]
  }
];