import React from 'react'
import Sidebar from '../components/Sidebar'
import MiddleSection from '../components/MiddleSection'
import RightSection from '../components/RightSection'

const Home = () => {
  return (
    <div className='grid sm:grid-cols-2 w-[75vw]'>
      <MiddleSection/>
      <RightSection/>
    </div>
  )
}

export default Home
