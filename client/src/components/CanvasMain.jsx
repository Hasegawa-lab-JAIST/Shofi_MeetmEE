import React, { useRef, useEffect, useContext, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";
import axios from 'axios';
import {Holistic} from '@mediapipe/holistic';
import * as HOLISTIC from '@mediapipe/holistic';
import { Grid, Typography, Paper} from '@material-ui/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const useStyles = makeStyles(() => ({
    canvas: {
      width: '550px',
      marginTop:"-200%",
      marginBottom:"4%"
    },
}));

function encodeImageBitmapToBase64(imageBitmap) {
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0);

  const dataURL = canvas.toDataURL('image/png');
  return dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
}

function formatYAxis(value) {
  if(value === 0) return "Not Engage"
  if(value === 0.25) return ""
  if(value === 0.5) return "Normal"
  if(value === 0.75) return ""
  if(value === 1) return "Engage"
  return value
}

const CanvasMine = (props) => {
    const { myVideo } = useContext(SocketContext);
    const [response, setResponse] = useState(null);
    const [chartData, setChartData] = useState(null);
    const classes = useStyles();
    const canvasRef = useRef();
    const canvasRefuser = useRef();
 
    // ======================Holistic Mediapipe===========================
    const connect = window.drawConnectors;

    
    
    function onResults(results){
      const videoElement = document.getElementById(props.id);
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      // console.log(results)

      // Set canvas width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
  
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext('2d');
      canvasCtx.save();
  
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
  
      canvasCtx.globalCompositeOperation = 'source-over';
      connect(canvasCtx, results.poseLandmarks, HOLISTIC.POSE_CONNECTIONS,
                    {color: '#00FF00', lineWidth: 4});
      connect(canvasCtx, results.faceLandmarks, HOLISTIC.FACEMESH_TESSELATION,
                    {color: '#C0C0C070', lineWidth: 1});
      connect(canvasCtx, results.leftHandLandmarks, HOLISTIC.HAND_CONNECTIONS,
                    {color: '#CC0000', lineWidth: 5});
      connect(canvasCtx, results.rightHandLandmarks, HOLISTIC.HAND_CONNECTIONS,
                    {color: '#CC0000', lineWidth: 5});
      canvasCtx.restore();

      // Step 1 - Send to prediction function and get the label and prob ()
      // Sol1: Just JS (does not work)
      // Sol2: Send landmark to python and get the class and prob
      // axios.post(`http://localhost:5050/api`, {
      //   landmark_from_js: results,
      // })
      // .then(res => {
      //   const predict_from_py = res.data;
      //   console.log(predict_from_py.class)
      //   console.log(predict_from_py.prob)
      // })
      // Sol3: Send video instead landmark
      const currentTime = new Date();
      const time = currentTime.getTime().toString()
      if (time.charAt(time.toString().length - 1) == 1) {
        const encodedImage = encodeImageBitmapToBase64(results.image);
        axios.post('http://localhost:5050/api', { encodedImage }).then((response) => {
          console.log(response.data);
          setResponse(response.data);
        });
      }
      // Step 2 - Write to CSV and draw a graph
      const data = [
        {
          "name": "1",
          "engagement": 0,
        },
        {
          "name": "2",
          "engagement": 1,
        },
        {
          "name": "3",
          "engagement": 0.5,
        },
        {
          "name": "4",
          "engagement": 0,
        }
      ]
      setChartData(data)
    }

    useEffect(() => {
      const holistic = new Holistic({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      }});

      holistic.setOptions({
        modelComplexity: 1,
        // selfieMode: true, 
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      holistic.onResults(onResults);
        
      let prevTime;
      const myVideoTag = myVideo.current;
      async function drawImage(){
        if (Date.now() - prevTime > 60) {
          prevTime = Date.now();
          if (myVideoTag.currentTime !== 0){
            const imageBitMap = await createImageBitmap(myVideoTag);
            await holistic.send({image: imageBitMap}); 
          }
        }
        window.requestAnimationFrame(drawImage);
      }

      myVideoTag.play();
      prevTime = Date.now();
      window.requestAnimationFrame(drawImage);

      }, []);
    
        return (
          <>
          {props.id === "myVideoId"}
            <canvas ref={canvasRef} className={classes.canvas} />
            {response && (
              <div>
                <Typography variant="h5" gutterBottom>{response.class}</Typography>
                <Typography variant="h5" gutterBottom>{response.prob}</Typography>
              </div>        
            )}
            {chartData && (
                <LineChart width={500} height={250} data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* <XAxis dataKey="name" /> */}
                <YAxis tickFormatter={formatYAxis} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="engagement" stroke="#82ca9d" />
                </LineChart>
            )}
          </>
        );
};

export default CanvasMine;