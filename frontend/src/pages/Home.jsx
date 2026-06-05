import React from 'react'
import Sidebar from '../components/Sidebar'
import MiddleSection from '../components/MiddleSection'
import RightSection from '../components/RightSection'

const Home = () => {
  return (
    <div className='flex flex-col lg:flex-row w-full max-w-7xl mx-auto gap-4'>
      <MiddleSection/>
      <RightSection/>
    </div>
  )
}

export default Home
