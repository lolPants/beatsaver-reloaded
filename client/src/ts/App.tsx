import React, { FunctionComponent, Suspense } from 'react'
import { Boundary } from './components/Boundary'
import { Footer } from './components/Footer'
import { Loader } from './components/Loader'
import Navbar from './components/Navbar'
import { Routes } from './Routes'

export const App: FunctionComponent = () => (
  <>
    <Navbar />

    <div className='layout'>
      <div className='container has-footer side-pad'>
        <Boundary>
          <Suspense fallback={<Loader />}>
            <Routes />
          </Suspense>
        </Boundary>
      </div>

      <Footer />
    </div>
  </>
)
