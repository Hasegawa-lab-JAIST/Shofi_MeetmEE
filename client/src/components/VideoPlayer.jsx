import React, { useContext } from "react";
import { Grid, Typography, Paper} from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";
import CanvasMediapipe from '../components/CanvasMediapipe';

const useStyles = makeStyles((theme) => ({
    // video: {
    //   width: '550px',
    //   [theme.breakpoints.down('xs')]: {
    //     width: '300px',
    //   },
    // },
    video: {
      width: '550px',
      display: 'flex',
      zIndex:9,
    },
    gridContainer: {
      justifyContent: 'center',
      [theme.breakpoints.down('xs')]: {
        flexDirection: 'column',
      },
    },
    paper: {
      padding: '10px',
      border: '2px solid black',
      margin: '10px',
    },
}));


const VideoPlayer = ({children}) => {
    const { name, callAccepted, myVideo, userVideo, callEnded, stream, call } = useContext(SocketContext);
    const classes = useStyles();
    // console.log("MyVideo Video player,", myVideo.current);
    // console.log("UserVideo Video player,", userVideo.current);
   
    return (
        <Grid container className={classes.gridContainer}> 
            {/* Our own video */}
            { stream && (
                <Paper className={classes.paper}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h5" gutterBottom>{name || 'Name'}</Typography>
                        <video id="myVideoId"  playsInline muted ref={myVideo} autoPlay className={classes.video}/>
                        {children}
                        <CanvasMediapipe id="myVideoId"></CanvasMediapipe>
                    </Grid>
                </Paper>
            )}
            
            {/* User's video */}
            {callAccepted && !callEnded && (
                <Paper className={classes.paper}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
                        <video id="userVideoId" playsInline ref={userVideo} autoPlay className={classes.video} />
                        {children}
                        <CanvasMediapipe id="userVideoId"></CanvasMediapipe>
                    </Grid>
                </Paper>
            )}
        </Grid>

    );
};

export default VideoPlayer;
