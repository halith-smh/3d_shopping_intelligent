import { Loader } from '@react-three/drei'
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { BgImage, Scenario } from '../components';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { TbLogout } from 'react-icons/tb';
import toast from 'react-hot-toast';
import ChatInterface from '../components/Home/ChatInterface';

const Home = () => {
    const nav = useNavigate();
    const [messageQueue, setMessageQueue] = useState([]);

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

    const logOut = () => {
        localStorage.removeItem('token'); 
        nav('/login'); 
        toast.success('Logout Successful');
    }

    // Handle responses from the chat interface
    const handleChatResponse = (messages) => {
        setMessageQueue(messages);
    };

    return (
        <BgImage>
            <div className='p-0 m-0 h-screen w-screen'>
                <Loader />
                <Leva collapsed/>
                <div className='absolute top-6 right-4 z-50'>
                    <button onClick={logOut} title='Logout' className='bg-dark rounded-md text-2xl p-2 text-white cursor-pointer'><TbLogout /></button>
                </div>
                <div className='absolute top-6 left-4 z-50'>
                    <div className='bg-dark rounded-md text-lg py-2 px-4 text-white cursor-pointer'>🤖 3D Shopping Intelligent</div>
                </div>
                <ChatInterface onResponse={handleChatResponse} />
                <Canvas shadows camera={{ position: [0, 0, 0], fov: 10 }}>
                    <Scenario messageQueue={messageQueue} />
                </Canvas>
            </div>
        </BgImage>
    );
};

export default Home;