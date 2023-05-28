export const useAmazonHost = async (scene) => {
  await main(scene);
};

const speakers = new Map([
  ["Grace", undefined],
  ["Alien", undefined],
]);

async function main(scene) {
  // Initialize AWS and create Polly service objects
  window.AWS.config.region = "us-east-1";
  window.AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:3bcf3cee-80d6-407c-8dec-a13c86896607",
  });
  const polly = new AWS.Polly();
  const presigner = new AWS.Polly.Presigner();
  const speechInit = HOST.aws.TextToSpeechFeature.initializeService(
    polly,
    presigner,
    window.AWS.VERSION
  );

  // Define the glTF assets that will represent the hosts
  const characterFile1 =
    "./assets/glTF/characters/adult_female/grace/grace.gltf";
  const animationPath1 = "./assets/glTF/animations/adult_female";
  const animationPath2 = "./assets/glTF/animations/alien";
  const animationFiles = [
    "stand_idle.glb",
    "lipsync.glb",
    "gesture.glb",
    "emote.glb",
    "face_idle.glb",
    "blink.glb",
    "poi.glb",
  ];
  const gestureConfigFile = "gesture.json";
  const poiConfigFile = "poi.json";
  const audioAttachJoint1 = "char:def_c_neckB"; // Name of the joint to attach audio to
  const audioAttachJoint2 = "char:head";
  const lookJoint1 = "char:jx_c_look"; // Name of the joint to use for point of interest target tracking
  //const lookJoint1 = "char:gaze"; // Name of the joint to use for point of interest target tracking
  const lookJoint2 = "char:gaze";
  const voice1 = "Joanna"; // Polly voice. Full list of available voices at: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
  const voice2 = "Ivy";
  const voiceEngine = "neural"; // Neural engine is not available for all voices in all regions: https://docs.aws.amazon.com/polly/latest/dg/NTTS-main.html

  // Set up the scene and hosts
  await createScene();
  const {
    character: character1,
    clips: clips1,
    bindPoseOffset: bindPoseOffset1,
  } = await loadCharacter(
    scene,
    characterFile1,
    animationPath1,
    animationFiles
  );
  /*
  const {
    character: character2,
    clips: clips2,
    bindPoseOffset: bindPoseOffset2,
  } = await loadCharacter(
    scene,
    characterFile2,
    animationPath2,
    animationFiles
  );
*/
  character1.position = new BABYLON.Vector3(-1, 0, -1);
  character1.rotation = new BABYLON.Vector3(0, -90, 0);
  // character2.position.x = -0.5;
  //character2.rotation.y = 0.5;

  // Find the joints defined by name
  const children1 = character1.getDescendants(false);
  const audioAttach1 = children1.find(
    (child) => child.name === audioAttachJoint1
  );
  const lookTracker1 = children1.find((child) => child.name === lookJoint1);
  /*const children2 = character2.getDescendants(false);
  const audioAttach2 = children2.find(
    child => child.name === audioAttachJoint2
  );
  const lookTracker2 = children2.find(child => child.name === lookJoint2);
*/
  // Read the gesture config file. This file contains options for splitting up
  // each animation in gestures.glb into 3 sub-animations and initializing them
  // as a QueueState animation.
  const gestureConfig1 = await fetch(
    `${animationPath1}/${gestureConfigFile}`
  ).then((response) => response.json());
  const gestureConfig2 = await fetch(
    `${animationPath2}/${gestureConfigFile}`
  ).then((response) => response.json());

  // Read the point of interest config file. This file contains options for
  // creating Blend2dStates from look pose clips and initializing look layers
  // on the PointOfInterestFeature.
  const poiConfig1 = await fetch(
    `${animationPath1}/${poiConfigFile}`
  ).then((response) => response.json());
  const poiConfig2 = await fetch(
    `${animationPath2}/${poiConfigFile}`
  ).then((response) => response.json());

  const [
    idleClips1,
    lipsyncClips1,
    gestureClips1,
    emoteClips1,
    faceClips1,
    blinkClips1,
    poiClips1,
  ] = clips1;
  const host1 = createHost(
    character1,
    audioAttach1,
    voice1,
    voiceEngine,
    idleClips1[0],
    faceClips1[0],
    lipsyncClips1,
    gestureClips1,
    gestureConfig1,
    emoteClips1,
    blinkClips1,
    poiClips1,
    poiConfig1,
    lookTracker1,
    bindPoseOffset1,
    scene,
    window.followCamera
  );
  /*
  const [
    idleClips2,
    lipsyncClips2,
    gestureClips2,
    emoteClips2,
    faceClips2,
    blinkClips2,
    poiClips2,
  ] = clips2;
  const host2 = createHost(
    character2,
    audioAttach2,
    voice2,
    voiceEngine,
    idleClips2[0],
    faceClips2[0],
    lipsyncClips2,
    gestureClips2,
    gestureConfig2,
    emoteClips2,
    blinkClips2,
    poiClips2,
    poiConfig2,
    lookTracker2,
    bindPoseOffset2,
    scene,
    window.followCamera
  );
*/
  // Turn down blink layer weight to account for the difference in eyelid height between Grace and Fiona
  host1.AnimationFeature.setLayerWeight("Blink", 0.5);

  // Set up each host to look at the other when the other speaks and at the
  // camera when speech ends
  const onHost1StartSpeech = () => {
    //host2.PointOfInterestFeature.setTarget(lookTracker1);
  };
  const onHost2StartSpeech = () => {
    host1.PointOfInterestFeature.setTarget(lookTracker2);
  };
  const onStopSpeech = () => {
    //host1.PointOfInterestFeature.setTarget(window.followCamera);
    //host2.PointOfInterestFeature.setTarget(window.followCamera);
  };

  host1.listenTo(host1.TextToSpeechFeature.EVENTS.play, onHost1StartSpeech);
  host1.listenTo(host1.TextToSpeechFeature.EVENTS.resume, onHost1StartSpeech);
  /*
  host2.listenTo(
    host2.TextToSpeechFeature.EVENTS.play,
    onHost2StartSpeech
  );
  host2.listenTo(
    host2.TextToSpeechFeature.EVENTS.resume,
    onHost2StartSpeech
  );
  */
  HOST.aws.TextToSpeechFeature.listenTo(
    HOST.aws.TextToSpeechFeature.EVENTS.pause,
    onStopSpeech
  );
  HOST.aws.TextToSpeechFeature.listenTo(
    HOST.aws.TextToSpeechFeature.EVENTS.stop,
    onStopSpeech
  );

  // Hide the load screen and show the text input
  document.getElementById("textToSpeech").style.display = "inline-block";
  // Wait for the TextToSpeechFeature to be ready
  await speechInit;

  speakers.set("Grace", host1);
  //speakers.set('Alien', host2);

  initializeUX();
}

// Set up base scene
async function createScene() {
  const scene = window.scene;
  const canvas = document.getElementById("csv");
  //const engine = new BABYLON.Engine(canvas, true, undefined, true);
  // Use our own button to enable audio
  BABYLON.Engine.audioEngine.useCustomUnlockedButton = true;

  // Camera
  const camera = new BABYLON.ArcRotateCamera(
    "Camera",
    Math.PI / 2,
    Math.PI / 2,
    1.4,
    new BABYLON.Vector3(0, 1.8, 0),
    scene
  );
  camera.minZ = 0.1;
  camera.maxZ = 1000;
  camera.setPosition(new BABYLON.Vector3(0, 1.8, 0));
  camera.setTarget(new BABYLON.Vector3(0, 1.8, 0));
  camera.wheelDeltaPercentage = 0.01;
  scene.activeCamera.attachControl(canvas, true);
  //square
  var light1 = new BABYLON.PointLight(
    "PointLight_sq",
    new BABYLON.Vector3(2, 2, 0),
    scene
  );
  light1.diffuse = new BABYLON.Color3(0.99, 0.95, 0.81);
  //tv
  var light2 = new BABYLON.PointLight(
    "PointLight_tv",
    new BABYLON.Vector3(-2, 2, 0),
    scene
  );
  light2.diffuse = new BABYLON.Color3(0.99, 0.95, 0.81);
  // Shadows
  var shadowGenerator = new BABYLON.ShadowGenerator(1024, light1);
  shadowGenerator.useExponentialShadowMap = true;

  var shadowGenerator2 = new BABYLON.ShadowGenerator(1024, light2);
  shadowGenerator2.usePoissonSampling = true;

  let floor = scene.getMeshByName("Room_Modern_Floor");
  floor.receiveShadows = true;
  // here we add XR support

  const xrHelper = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [floor],
    optionalFeatures: true,
  });
  window.followCamera = scene.activeCamera;
  setupControllers(xrHelper);
}

// Load character model and animations
async function loadCharacter(
  scene,
  characterFile,
  animationPath,
  animationFiles
) {
  // Load character model
  const {
    character,
    bindPoseOffset,
  } = await BABYLON.SceneLoader.LoadAssetContainerAsync(characterFile).then(
    (container) => {
      const [character] = container.meshes;
      const [bindPoseOffset] = container.animationGroups;

      // Make the offset pose additive
      if (bindPoseOffset) {
        BABYLON.AnimationGroup.MakeAnimationAdditive(bindPoseOffset);
      }

      // Add everything to the scene
      container.scene = scene;
      container.addAllToScene();

      // Cast shadows but don't receive
      //shadowGenerator.addShadowCaster(character, true);
      for (var index = 0; index < container.meshes.length; index++) {
        container.meshes[index].receiveShadows = false;
      }

      return { character, bindPoseOffset };
    }
  );

  const children = character.getDescendants(false);

  // Load animations
  const clips = await Promise.all(
    animationFiles.map((filename, index) => {
      const filePath = `${animationPath}/${filename}`;

      return BABYLON.SceneLoader.LoadAssetContainerAsync(filePath).then(
        (container) => {
          const startingIndex = scene.animatables.length;
          const firstIndex = scene.animationGroups.length;

          // Apply animation to character
          container.mergeAnimationsTo(
            scene,
            scene.animatables.slice(startingIndex),
            (target) => children.find((c) => c.name === target.name) || null
          );

          // Find the new animations and destroy the container
          const animations = scene.animationGroups.slice(firstIndex);
          container.dispose();
          scene.onAnimationFileImportedObservable.notifyObservers(scene);

          return animations;
        }
      );
    })
  );

  return { character, clips, bindPoseOffset };
}

// Initialize the host
function createHost(
  character,
  audioAttachJoint,
  voice,
  engine,
  idleClip,
  faceIdleClip,
  lipsyncClips,
  gestureClips,
  gestureConfig,
  emoteClips,
  blinkClips,
  poiClips,
  poiConfig,
  lookJoint,
  bindPoseOffset,
  scene,
  camera
) {
  // Add the host to the render loop
  const host = new HOST.HostObject({ owner: character });
  scene.onBeforeAnimationsObservable.add(() => {
    host.update();
  });

  // Set up text to speech
  host.addFeature(HOST.aws.TextToSpeechFeature, false, {
    scene,
    attachTo: audioAttachJoint,
    voice,
    engine,
  });

  // Set up animation
  host.addFeature(HOST.anim.AnimationFeature);

  // Base idle
  host.AnimationFeature.addLayer("Base");
  host.AnimationFeature.addAnimation(
    "Base",
    idleClip.name,
    HOST.anim.AnimationTypes.single,
    { clip: idleClip }
  );
  host.AnimationFeature.playAnimation("Base", idleClip.name);

  // Face idle
  host.AnimationFeature.addLayer("Face", {
    blendMode: HOST.anim.LayerBlendModes.Additive,
  });
  BABYLON.AnimationGroup.MakeAnimationAdditive(faceIdleClip);
  host.AnimationFeature.addAnimation(
    "Face",
    faceIdleClip.name,
    HOST.anim.AnimationTypes.single,
    { clip: faceIdleClip, from: 1 / 30, to: faceIdleClip.to }
  );
  host.AnimationFeature.playAnimation("Face", faceIdleClip.name);

  // Blink
  host.AnimationFeature.addLayer("Blink", {
    blendMode: HOST.anim.LayerBlendModes.Additive,
    transitionTime: 0.075,
  });
  blinkClips.forEach((clip) => {
    BABYLON.AnimationGroup.MakeAnimationAdditive(clip);
  });
  host.AnimationFeature.addAnimation(
    "Blink",
    "blink",
    HOST.anim.AnimationTypes.randomAnimation,
    {
      playInterval: 3,
      subStateOptions: blinkClips.map((clip) => {
        return {
          name: clip.name,
          loopCount: 1,
          clip,
        };
      }),
    }
  );
  host.AnimationFeature.playAnimation("Blink", "blink");

  // Talking idle
  host.AnimationFeature.addLayer("Talk", {
    transitionTime: 0.75,
    blendMode: HOST.anim.LayerBlendModes.Additive,
  });
  host.AnimationFeature.setLayerWeight("Talk", 0);
  const talkClip = lipsyncClips.find((c) => c.name === "stand_talk");
  BABYLON.AnimationGroup.MakeAnimationAdditive(talkClip);
  lipsyncClips.splice(lipsyncClips.indexOf(talkClip), 1);
  host.AnimationFeature.addAnimation(
    "Talk",
    talkClip.name,
    HOST.anim.AnimationTypes.single,
    { clip: talkClip }
  );
  host.AnimationFeature.playAnimation("Talk", talkClip.name);

  // Gesture animations
  host.AnimationFeature.addLayer("Gesture", {
    transitionTime: 0.5,
    blendMode: HOST.anim.LayerBlendModes.Additive,
  });

  gestureClips.forEach((clip) => {
    const { name } = clip;
    const config = gestureConfig[name];
    BABYLON.AnimationGroup.MakeAnimationAdditive(clip);

    if (config !== undefined) {
      // Add the clip to each queueOption so it can be split up
      config.queueOptions.forEach((option, index) => {
        option.clip = clip;
        option.to /= 30.0;
        option.from /= 30.0;
      });
      host.AnimationFeature.addAnimation(
        "Gesture",
        name,
        HOST.anim.AnimationTypes.queue,
        config
      );
    } else {
      host.AnimationFeature.addAnimation(
        "Gesture",
        name,
        HOST.anim.AnimationTypes.single,
        { clip }
      );
    }
  });

  // Emote animations
  host.AnimationFeature.addLayer("Emote", {
    transitionTime: 0.5,
  });

  emoteClips.forEach((clip) => {
    const { name } = clip;
    host.AnimationFeature.addAnimation(
      "Emote",
      name,
      HOST.anim.AnimationTypes.single,
      { clip, loopCount: 1 }
    );
  });

  // Viseme poses
  host.AnimationFeature.addLayer("Viseme", {
    transitionTime: 0.12,
    blendMode: HOST.anim.LayerBlendModes.Additive,
  });
  host.AnimationFeature.setLayerWeight("Viseme", 0);
  const blendStateOptions = lipsyncClips.map((clip) => {
    BABYLON.AnimationGroup.MakeAnimationAdditive(clip);
    return {
      name: clip.name,
      clip,
      weight: 0,
      from: 1 / 30,
      to: 2 / 30,
    };
  });
  host.AnimationFeature.addAnimation(
    "Viseme",
    "visemes",
    HOST.anim.AnimationTypes.freeBlend,
    { blendStateOptions }
  );
  host.AnimationFeature.playAnimation("Viseme", "visemes");

  // POI poses
  const children = character.getDescendants(false);
  poiConfig.forEach((config) => {
    host.AnimationFeature.addLayer(config.name, {
      blendMode: HOST.anim.LayerBlendModes.Additive,
    });

    // Find each pose clip and make it additive
    config.blendStateOptions.forEach((clipConfig) => {
      let clip = poiClips.find((item) => item.name === clipConfig.clip);
      BABYLON.AnimationGroup.MakeAnimationAdditive(clip);
      clipConfig.clip = clip;
      clipConfig.from = 1 / 30;
      clipConfig.to = 2 / 30;
    });

    host.AnimationFeature.addAnimation(
      config.name,
      config.animation,
      HOST.anim.AnimationTypes.blend2d,
      { ...config }
    );

    host.AnimationFeature.playAnimation(config.name, config.animation);

    // Find and store the reference object
    config.reference = children.find(
      (child) => child.name === config.reference
    );
  });

  // Apply bindPoseOffset clip if it exists
  if (bindPoseOffset !== undefined) {
    host.AnimationFeature.addLayer("BindPoseOffset", {
      blendMode: HOST.anim.LayerBlendModes.Additive,
    });
    host.AnimationFeature.addAnimation(
      "BindPoseOffset",
      bindPoseOffset.name,
      HOST.anim.AnimationTypes.single,
      { clip: bindPoseOffset, from: 1 / 30, to: 2 / 30 }
    );
    host.AnimationFeature.playAnimation("BindPoseOffset", bindPoseOffset.name);
  }

  // Set up Lipsync
  const visemeOptions = {
    layers: [
      {
        name: "Viseme",
        animation: "visemes",
      },
    ],
  };
  const talkingOptions = {
    layers: [
      {
        name: "Talk",
        animation: "stand_talk",
        blendTime: 0.75,
        easingFn: HOST.anim.Easing.Quadratic.InOut,
      },
    ],
  };
  host.addFeature(HOST.LipsyncFeature, false, visemeOptions, talkingOptions);

  // Set up Gestures
  host.addFeature(HOST.GestureFeature, false, {
    layers: {
      Gesture: { minimumInterval: 3 },
      Emote: {
        blendTime: 0.5,
        easingFn: HOST.anim.Easing.Quadratic.InOut,
      },
    },
  });
  /*
  // Set up Point of Interest
  host.addFeature(
    HOST.PointOfInterestFeature,
    false,
    {
      target: camera,
      lookTracker: lookJoint,
      scene,
    },
    {
      layers: poiConfig,
    },
    {
      layers: [{ name: "Blink" }],
    }
  );
*/
  return host;
}

// Return the host whose name matches the text of the current tab
function getCurrentHost() {
  const tab = document.getElementsByClassName("tab current")[0];
  const name = tab.textContent;

  return { name, host: speakers.get(name) };
}

// Update UX with data for the current host
function toggleHost(evt) {
  const tab = evt.target;
  const allTabs = document.getElementsByClassName("tab");

  // Update tab classes
  for (let i = 0, l = allTabs.length; i < l; i++) {
    if (allTabs[i] !== tab) {
      allTabs[i].classList.remove("current");
    } else {
      allTabs[i].classList.add("current");
    }
  }

  // Show/hide speech input classes
  const { name, host } = getCurrentHost(speakers);
  const textEntries = document.getElementsByClassName("textEntry");

  for (let i = 0, l = textEntries.length; i < l; i += 1) {
    const textEntry = textEntries[i];

    if (textEntry.classList.contains(name)) {
      textEntry.classList.remove("hidden");
    } else {
      textEntry.classList.add("hidden");
    }
  }

  // Update emote selector
  // const emoteSelect = document.getElementById("emotes");
  // emoteSelect.length = 0;
  // const emotes = host.AnimationFeature.getAnimations("Emote");
  // emotes.forEach((emote, i) => {
  //   const emoteOption = document.createElement("option");
  //   emoteOption.text = emote;
  //   emoteOption.value = emote;
  //   emoteSelect.add(emoteOption, 0);

  //   // Set the current item to the first emote
  //   if (!i) {
  //     emoteSelect.value = emote;
  //   }
  // });
}

function initializeUX(speakers) {
  // Enable drag/drop text files on the speech text area
  enableDragDrop("textEntry");

  // Play, pause, resume and stop the contents of the text input as speech
  // when buttons are clicked
  // ["play", "pause", "resume", "stop"].forEach((id) => {
  // const button = document.getElementById(id);
  // button.onclick = () => handleTextToSpeech(id);
  // });
  const button = document.getElementById("record");
  button.onclick = () => handleVoiceConversation("record");

  const button1 = document.getElementById("play");
  button1.onclick = () => handleTextToSpeechSumit("play");
  // Update the text area text with gesture SSML markup when clicked
  // const gestureButton = document.getElementById("gestures");
  // gestureButton.onclick = () => associateGesturesSpeech();

  // Play emote on demand with emote button
  // const emoteSelect = document.getElementById("emotes");
  // const emoteButton = document.getElementById("playEmote");
  // emoteButton.onclick = () => {
  //   const { host } = getCurrentHost(speakers);
  //   host.GestureFeature.playGesture("Emote", emoteSelect.value);
  // };

  // Initialize tab
  const tab = document.getElementsByClassName("tab current")[0];
  toggleHost({ target: tab });
}

function enableDragDrop(className) {
  const elements = document.getElementsByClassName(className);

  for (let i = 0, l = elements.length; i < l; i += 1) {
    const dropArea = elements[i];

    // Copy contents of files into the text input once they are read
    const fileReader = new FileReader();
    fileReader.onload = (evt) => {
      dropArea.value = evt.target.result;
    };

    // Drag and drop listeners
    dropArea.addEventListener("dragover", (evt) => {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = "copy";
    });

    dropArea.addEventListener("drop", (evt) => {
      evt.stopPropagation();
      evt.preventDefault();

      // Read the first file that was dropped
      const [file] = evt.dataTransfer.files;
      fileReader.readAsText(file, "UTF-8");
    });
  }
}

function associateGesturesSpeech(speechInput) {
  const { name, host } = getCurrentHost(speakers);
  //const speechInput = document.getElementsByClassName(`textEntry ${name}`)[0];
  const gestureMap = host.GestureFeature.createGestureMap();
  // const gestureArray = host.Gestur
  // console.log("ASSOCIATEGESTURE",speechInput)
  var gestureArray=host.GestureFeature.createGenericGestureArray([
    "Gesture",
  ]);
  return HOST.aws.TextToSpeechUtils.autoGenerateSSMLMarks(
    speechInput,
    gestureMap,
    gestureArray
  );
}
//added sumit
function handleVoiceConversation(action){
  //debugger
  const { name, host } = getCurrentHost(speakers);
  var globalResponse = ''
  
  var waveform = window.Waveform();
  var message = document.getElementById('message');
  var config, conversation;
  message.textContent = 'Passive';


  AWS.config.region = 'us-east-1'; // Region
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:3bcf3cee-80d6-407c-8dec-a13c86896607',
  });
  
  config = {
      lexConfig: {botId : 'RGZLN5GONH'}
  };

  conversation = new LexAudio.conversation(config, function (state) {
      message.textContent = state + '...';
      if (state === 'Listening') {
          waveform.prepCanvas();
      }
      if (state === 'Sending') {
          waveform.clearCanvas();
      }
  }, function (data) {
      console.log('Transcript: ', data.inputTranscript, ", Response: ", data.messages);
      var gezipedData=atob(data.messages)
      const gzipedDataArray = Uint8Array.from(gezipedData, c => c.charCodeAt(0))
      console.log('gzipeddata', gzipedDataArray);
      const ungzipedData = pako.ungzip(gzipedDataArray);       
      var response=JSON.parse(new TextDecoder().decode(ungzipedData))
      //console.log( typeof JSON.parse(response ))
      var lexResponse = ''
      lexResponse = response[0].content;
      globalResponse = lexResponse
      lexResponse = associateGesturesSpeech(lexResponse);
      host.TextToSpeechFeature[action](lexResponse);
      console.log(lexResponse)
      // var lexResponse = response[0].content;
      // console.log("content",response[0].content);
      // lexResponse = associateGesturesSpeech(lexResponse);
      // host.TextToSpeechFeature(lexResponse);
    

      console.log("datafrom lexresponse",response);
  }, function (error) {
    console.log('Textcontent',error)
      message.textContent = error;
  }, function (timeDomain, bufferLength) {
      waveform.visualizeAudioBuffer(timeDomain, bufferLength);
  });
  
  conversation.advanceConversation();
}
function handleTextToSpeechSumit(action) {
  const { name, host } = getCurrentHost(speakers);
  var globalResponse = ''
  
  var waveform = window.Waveform();
  var message = document.getElementById('message');
  var config, conversation;
  message.textContent = 'Passive';


  AWS.config.region = 'us-east-1'; // Region
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:3bcf3cee-80d6-407c-8dec-a13c86896607',
  });
  
  config = {
      lexConfig: {botId : 'RGZLN5GONH'}
  };
  conversation = new LexAudio.conversation(config, function (state) {
    message.textContent = state + '...';
    if (state === 'Listening') {
        waveform.prepCanvas();
    }
    if (state === 'Sending') {
        waveform.clearCanvas();
    }
}, function (data) {
    console.log('Transcript: ', data.inputTranscript, ", Response: ", data.messages);
    var gezipedData=atob(data.messages)
    const gzipedDataArray = Uint8Array.from(gezipedData, c => c.charCodeAt(0))
    console.log('gzipeddata', gzipedDataArray);
    const ungzipedData = pako.ungzip(gzipedDataArray);       
    var response=JSON.parse(new TextDecoder().decode(ungzipedData))
    //console.log( typeof JSON.parse(response ))
    var lexResponse = ''
    lexResponse = response[0].content;
    globalResponse = lexResponse
    lexResponse = associateGesturesSpeech(lexResponse);
    host.TextToSpeechFeature[action](lexResponse);
    console.log(lexResponse)
    // var lexResponse = response[0].content;
    // console.log("content",response[0].content);
    // lexResponse = associateGesturesSpeech(lexResponse);
    // host.TextToSpeechFeature(lexResponse);
  

    console.log("datafrom lexresponse",response);
}, function (error) {
  console.log('Textcontent',error)
    message.textContent = error;
}, function (timeDomain, bufferLength) {
    waveform.visualizeAudioBuffer(timeDomain, bufferLength);
});

conversation.advanceConversation();
//host.TextToSpeechFeature[action]("Hi, Sumit");
  //const speechInput = document.getElementsByClassName(`textEntry ${name}`)[0];
  
}
function handleTextToSpeech_old(action) {
 
  const { name, host } = getCurrentHost(speakers);
  // const speechInput = document.getElementsByClassName(`textEntry ${name}`)[0];
const speechInput=document.getElementById("player")
// var blob=speechInput.src
// console.log("blobtype",blob.type)
console.log("speechinputrecordedchunks",speechInput.recordedChunks)
// const wavBlob = getWaveBlob(speechInput.recordedChunks,true);
// console.log("wavblob",wavBlob)
var mediaType = speechInput.type;
      var contentType = mediaType;
  console.log("speechinputsrc",speechInput.blob)
  console.log("speechinputlatest",speechInput.type)
  console.log("mediatypefromah",mediaType)
  if (mediaType.includes('audio/wav')) {
    contentType = 'audio/x-l16; sample-rate=16000; channel-count=1';
  } else if (mediaType.includes('audio/ogg')) {
    contentType = 'audio/x-cbr-opus-with-preamble; bit-rate=32000;' + " frame-size-milliseconds=20; preamble-size=".concat(offset);
  } else {
  
    console.warn('unknown media type in lex client');
  }
  // subhra
  console.log("speechinputlatest",speechInput)
  console.log("speechinputsrc",speechInput.src)
  // console.log("speechinputlatest",speechInput.type)
  var params = {
    botAliasId: "TSTALIASID" /* required */,
    botId: "RGZLN5GONH" /* required */,
    localeId: "en_US" /* required */,
    sessionId: "1234567890", //Math.random().toString() /* required */,
    requestContentType: contentType,
    responseContentType:'text/plain;charset=utf-8',
    inputStream: speechInput.blob,
  };
  var lexResponse = "";
  // console.log(params);
  const lex = new AWS.LexRuntimeV2();
  try {
    var lexPromise = lex.recognizeUtterance(params).promise();
    lexPromise
      .then(function(data) {
        // decode the base64 encoded data
        var gezipedData=atob(data.messages)
        // decode the base64 encoded data
        //const gezipedData = atob("H4sIAAAAAAAA//NIzcnJVyguSUzOzi9LLUrLyS/XUSjJSMzLLlZIyy9SSMwpT6wsVshIzSnIzEtXBACs78K6LwAAAA==")
        const gzipedDataArray = Uint8Array.from(gezipedData, c => c.charCodeAt(0))

        console.log('gzipeddata', gzipedDataArray);
        const ungzipedData = pako.ungzip(gzipedDataArray);
        

        console.log('ungziped data', new TextDecoder().decode(ungzipedData));        
        var response=new TextDecoder().decode(ungzipedData)
        // for(let item of response){
        //  console.log(item.content
        //       )        }
        // lexResponse=response.content

        console.log("datafrom lexresponse",lexResponse);
        console.log("response",typeof response);
        // lexResponse = data.messages;
        // console.log("datafrom lexresponse",data.messages);
        // console.log("decodedString",decodedString)
        // console.log("types",typeof data.messages)
        lexResponse = associateGesturesSpeech(lexResponse);
        host.TextToSpeechFeature[action](lexResponse);
        // for (var index in data.messages) {
        // console.log(data.messages[index].content);
        // lexResponse = data.messages[index].content;
        // host.TextToSpeechFeature[action](lexResponse);
        // }
        // console.log(data.messages[0].content);
        // lexResponse = data.messages[0].content;
        // host.TextToSpeechFeature[action](lexResponse);
      })
      .catch(function(err) {
        console.log("From Lex Promise ", err);
      });
  } catch (err) {
    console.log("Error in Lex invocation : ", err);
  }
  // subhra
  // host.TextToSpeechFeature[id](speechInput.value);
}

function setupControllers(xrHelper) {
  xrHelper.input.onControllerAddedObservable.add((controller) => {
    controller.onMotionControllerInitObservable.add((model) => {
      const a_button = model.getComponent("xr-standard-trigger");
      // found, do something with it.
      a_button &&
        a_button.onButtonStateChangedObservable.add(() => {
          if (a_button.pressed) {
            document.getElementById("record").click();
          } else {
            document.getElementById("stopRecording").click();
            setTimeout(() => document.getElementById("player").play(), 2000);
          }
        });
    });
  });
}
