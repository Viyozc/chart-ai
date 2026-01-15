declare module 'next/app' {
  import { ComponentType } from 'react'
  export interface AppProps {
    Component: ComponentType<any>
    pageProps: any
  }
}
