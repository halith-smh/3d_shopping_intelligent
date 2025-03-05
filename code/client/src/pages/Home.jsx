import { Loader } from '@react-three/drei'
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { BgImage, Scenario } from '../components';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { TbLogout } from 'react-icons/tb';
import toast from 'react-hot-toast';


const Home = () => {

    const nav = useNavigate();

    const verifyHomePage = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            nav('/login');
        }
        try {
            const { data } = await axiosInstance.get('/api/v1/user/home', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            console.log(data);
        } catch (error) {
            console.error(error);
            nav('/login');
        }
    }

    useEffect(() => {
        verifyHomePage();
    }, []);

    
    return (
        <BgImage>
            <div className='p-0 m-0 h-screen w-screen'>
                <Loader />
                <Leva collapsed />
                <div className='absolute top-6 right-4 z-50'>
                    <button onClick={() => {localStorage.removeItem('token'); nav('/login'); toast.success('Logout Successful')}} title='Logout' className='bg-dark rounded-md text-2xl p-2 text-white cursor-pointer'><TbLogout/></button>
                </div>
                {/* <ChatInterface /> */}
                <Canvas shadows camera={{ position: [0, 0, 0], fov: 10 }}>
                    <Scenario />
                </Canvas>
            </div>
        </BgImage>

    )
}

export default Home