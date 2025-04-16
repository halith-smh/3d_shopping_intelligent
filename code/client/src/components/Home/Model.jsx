import React, { useEffect, useRef, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import morphTargets from '../../utils/morphTargets';
import facialExpressions from '../../utils/facialExpressions';
import visemesMapping from '../../utils/visemesMapping';

export function Model(props) {
  const { nodes, materials } = useGLTF('/model/avatar2.glb');
  const { animations } = useGLTF("/model/animations2.glb");

  const logAnimations = (animations) => {
    console.group("Available Animations");
    console.table(animations.map(anim => ({
      Name: anim.name,
      Duration: `${anim.duration.toFixed(2)}s`,
      Tracks: anim.tracks.length,
      "First Track": anim.tracks[0]?.name || "N/A"
    })));
    console.groupEnd();

    // For more detailed inspection
    console.log("Full Animation Data:", animations);
  };

  // Then use it in your useEffect
  useEffect(() => {
    logAnimations(animations);
  }, [animations]);

  // For Animating Avatar - Model
  const group = useRef();
  const { actions, mixer } = useAnimations(animations, group);
  const [animation, setAnimation] = useState(animations.find((a) => a.name === "Standing Idle") ? "Standing Idle" : animations[0].name);

  // For lipsync animation
  const [lipSyncData, setLipSyncData] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [currentMouthCue, setCurrentMouthCue] = useState("X");
  const [audioStartTime, setAudioStartTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // For facial expressions
  const [currentFacialExpression, setCurrentFacialExpression] = useState("neutral");
  const [currentMessage, setCurrentMessage] = useState(null);

  // blink to control the eyes' state
  const [blink, setBlink] = useState(false);
  const { scene } = useThree();
  const idleTimeoutRef = useRef(null);

  // Track whether we are in the first frame after animation/expression changes
  const firstFrameRef = useRef(true);

  // Handle lip sync animation during playback
  useFrame(() => {
    // Handle eye blinking
    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.5);

    // Apply facial expression every frame to ensure it's active
    if (currentFacialExpression && facialExpressions[currentFacialExpression]) {
      applyFacialExpression(currentFacialExpression);
    }

    // Handle lip sync if audio is playing
    if (lipSyncData && audioElement && isPlaying) {
      const currentTime = audioElement.currentTime;

      // Find the current mouth cue based on the current time
      const currentCue = lipSyncData.mouthCues.find(
        cue => currentTime >= cue.start && currentTime <= cue.end
      );

      if (currentCue && currentCue.value !== currentMouthCue) {
        setCurrentMouthCue(currentCue.value);
        applyMouthShape(currentCue.value);
      }
    }

    // Reset first frame flag after first frame
    if (firstFrameRef.current) {
      firstFrameRef.current = false;
    }
  });

  // Eye blinking effect
  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 200);
      }, THREE.MathUtils.randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Animation effect - handle animation changes
  useEffect(() => {
    if (!actions || !actions[animation]) {
      console.warn(`Animation "${animation}" not found`);
      return;
    }

    // Stop any previous animations
    Object.values(actions).forEach(action => {
      if (action.isRunning()) {
        action.fadeOut(0.5);
      }
    });

    // Start the new animation with immediate response for first frame
    actions[animation]
      .reset()
      .fadeIn(0.5)
      .play();

    console.log(`Playing animation: ${animation}`);

    return () => {
      if (actions[animation]) {
        actions[animation].fadeOut(0.5);
      }
    };
  }, [animation, actions]);

  // Apply facial expression when it changes
  useEffect(() => {
    if (currentFacialExpression && facialExpressions[currentFacialExpression]) {
      console.log(`Applying facial expression: ${currentFacialExpression}`);
      firstFrameRef.current = true; // Mark as first frame after change
      applyFacialExpression(currentFacialExpression);
    }
  }, [currentFacialExpression]);

  // Handle audio playback and reset
  useEffect(() => {
    if (!audioElement) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setAudioStartTime(Date.now());
      console.log("Audio playback started");
    };

    const handleEnded = () => {
      setIsPlaying(false);
      resetMouthShape();

      // Set a timeout to return to idle state after a brief pause
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        setAnimation("Standing Idle");
        setCurrentFacialExpression("neutral");
        setCurrentMessage(null);
      }, 1000);

      console.log("Audio playback ended, resetting to idle");
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement]);

  // Apply smooth transitions to morph targets
  const lerpMorphTarget = (target, value, speed = 0.1) => {
    // Use a higher speed for the first frame after a change
    const effectiveSpeed = firstFrameRef.current ? 0.5 : speed;

    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index === undefined || child.morphTargetInfluences[index] === undefined) {
          return;
        }
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(child.morphTargetInfluences[index], value, effectiveSpeed);
      }
    });
  };

  // Reset all morph targets to zero
  const resetMorphTargets = () => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        for (let i = 0; i < child.morphTargetInfluences.length; i++) {
          child.morphTargetInfluences[i] = 0;
        }
      }
    });
  };

  // Apply mouth shapes for lipsync
  const applyMouthShape = (shape) => {
    // Reset all visemes first
    Object.values(visemesMapping).forEach(viseme => {
      lerpMorphTarget(viseme, 0, 0.3);
    });

    // Apply the current viseme
    const viseme = visemesMapping[shape] || visemesMapping['X'];
    lerpMorphTarget(viseme, 1.0, 0.3);
  };

  // Reset mouth shape
  const resetMouthShape = () => {
    Object.values(visemesMapping).forEach(viseme => {
      lerpMorphTarget(viseme, 0, 0.3);
    });
    setCurrentMouthCue("X");
  };

  // Apply facial expression based on the provided expression name
  const applyFacialExpression = (expressionName) => {
    const expression = facialExpressions[expressionName];
    if (!expression) return;

    // Reset other facial expressions that might conflict
    resetFacialExpressions();

    // Apply each morph target from the facial expression
    Object.entries(expression).forEach(([target, value]) => {
      if (target !== "eyeBlinkLeft" && target !== "eyeBlinkRight") {
        lerpMorphTarget(target, value, 0.3);
      }
    });
  };

  // Reset facial expressions
  const resetFacialExpressions = () => {
    // Reset all facial expression morph targets except eye blink
    const facialTargets = new Set();
    Object.values(facialExpressions).forEach(expression => {
      Object.keys(expression).forEach(target => {
        if (target !== "eyeBlinkLeft" && target !== "eyeBlinkRight") {
          facialTargets.add(target);
        }
      });
    });

    facialTargets.forEach(target => {
      lerpMorphTarget(target, 0, 0.3);
    });
  };

  // Process message data from the backend
  const processMessage = (message) => {
    // Cancel any pending reset to idle
    clearTimeout(idleTimeoutRef.current);

    // Store the current message
    setCurrentMessage(message);

    console.log("Processing message:", message);

    // Mark as first frame for immediate response
    firstFrameRef.current = true;

    // Set facial expression if provided
    if (message.facialExpression) {
      console.log(`Setting facial expression: ${message.facialExpression}`);
      setCurrentFacialExpression(message.facialExpression);
    }

    // Set animation if provided
    if (message.animation && actions[message.animation]) {
      console.log(`Setting animation: ${message.animation}`);
      setAnimation(message.animation);
    } else if (message.animation) {
      console.warn(`Animation not found: ${message.animation}`);
    }

    // Handle audio and lipsync
    if (message.audio && message.lipsync) {
      playAudioWithLipsync(message.audio, message.lipsync);
    }
  };

  // Play audio with lipsync
  const playAudioWithLipsync = (audioData, lipsyncData) => {
    // Stop any previous audio
    if (audioElement) {
      audioElement.pause();
      audioElement.removeAttribute('src');
    }

    // Convert base64 audio to blob
    const audioBlob = base64ToBlob(audioData, 'audio/mpeg');
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create and play audio element
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    setAudioElement(audio);
    setLipSyncData(lipsyncData);

    // Start playback immediately after settings are applied
    setTimeout(() => {
      audio.play()
        .then(() => {
          console.log("Audio playback started successfully");
        })
        .catch(err => {
          console.error("Error playing audio:", err);
          // If audio fails, still trigger animation and expression
          setIsPlaying(true);
          setAudioStartTime(Date.now());

          // Auto-reset after the expected duration
          const duration = lipsyncData?.metadata?.duration || 3;
          setTimeout(() => {
            setIsPlaying(false);
            resetMouthShape();

            clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = setTimeout(() => {
              setAnimation("Standing Idle");
              setCurrentFacialExpression("neutral");
              setCurrentMessage(null);
            }, 1000);
          }, duration * 1000);
        });
    }, 50); // Small delay to ensure other state changes are processed first
  };

  // Utility to convert base64 to blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  // Reset everything when component unmounts
  useEffect(() => {
    return () => {
      clearTimeout(idleTimeoutRef.current);

      if (audioElement) {
        audioElement.pause();
        audioElement.removeAttribute('src');
      }

      resetMorphTargets();
      resetMouthShape();
      resetFacialExpressions();
    };
  }, []);

  // Expose the processMessage function to the parent component
  React.useImperativeHandle(props.modelRef, () => ({
    processMessage,
    resetToIdle: () => {
      setAnimation("Standing Idle");
      setCurrentFacialExpression("default");
      resetMouthShape();
      if (audioElement) {
        audioElement.pause();
        audioElement.removeAttribute('src');
      }
    }
  }));

  return (
    <group ref={group} {...props} dispose={null} position={[-0.06, -0.38, 0]}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
    </group>
  );
}

useGLTF.preload('/model/avatar2.glb');
useGLTF.preload('/model/animations2.glb');