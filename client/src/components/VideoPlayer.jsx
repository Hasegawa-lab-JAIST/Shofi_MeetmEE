import React, { useContext } from "react";
import { Grid, Typography, Paper} from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";
import CanvasUser from "./CanvasUser";
import CanvasMain from "./CanvasMain"

const useStyles = makeStyles((theme) => ({
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


const VideoPlayer = () => {
    const { name, callAccepted, myVideo, userVideo, callEnded, stream, call } = useContext(SocketContext);
    const classes = useStyles();
   
    return (
        <Grid container className={classes.gridContainer}> 
            {/* Our own video */}
            { stream && (
                <Paper className={classes.paper}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h5" gutterBottom>{name || 'Name'}</Typography>
                        <video id="myVideoId"  playsInline muted ref={myVideo} autoPlay className={classes.video}/>
                        <CanvasMain id="myVideoId" />
                    </Grid>
                </Paper>
            )}
            
            {/* User's video */}
            {callAccepted && !callEnded && (
                <Paper className={classes.paper}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
                        <video id="userVideoId" playsInline ref={userVideo} autoPlay className={classes.video} />
                        <CanvasUser id="userVideoId" />
                    </Grid>
                </Paper>
            )}
        </Grid>

    );
};

export default VideoPlayer;
