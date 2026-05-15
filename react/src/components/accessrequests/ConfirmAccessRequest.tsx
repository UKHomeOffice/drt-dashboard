import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ListItemText from "@mui/material/ListItemText";
import {ListItem} from "@mui/material";
import List from "@mui/material/List";

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface IProps {
  emails: string[]
  failedEmails?: string[]
  message: string
  parentRequestPosted: boolean
  setParentRequestPosted: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
  receivedUserDetails: boolean
  setReceivedUserDetails: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
  openModel: boolean
  setOpenModel: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export default function ConfirmAccessRequest(props: IProps) {
  const successfulEmails = props.emails
  const failedEmails = props.failedEmails ?? []
  const hasSuccesses = successfulEmails.length > 0
  const hasFailures = failedEmails.length > 0

  const resetRequestPosted = () => {
    props.setReceivedUserDetails(false)
    props.setParentRequestPosted(false)
    props.setOpenModel(false)
  }

  const emailList = (emails: string[]) => (
    <List>
      {emails.map(e =>
        <ListItem key={e}>
          <ListItemText
            primary={e}
          />
        </ListItem>,
      )}
    </List>
  )

  const moreThanOneUserDisplay = () => {
    return <div>
      The following users have had their request {actionLabel()}
      {emailList(successfulEmails)}
    </div>
  }

  const failedUsersDisplay = () => {
    return <div>
      The following users could not be {actionLabel()}
      {emailList(failedEmails)}
    </div>
  }

  const successDisplay = () => {
    if (successfulEmails.length > 1) {
      return moreThanOneUserDisplay()
    }

    return <div>
      {successfulEmails} has had their request {actionLabel()}
    </div>
  }

  const partialSuccessDisplay = () => {
    return <div>
      {successDisplay()}
      {failedUsersDisplay()}
      <Typography sx={{mt: 2}}>
        Please retry the failed users. If the issue persists, check the logs or complete the action manually.
      </Typography>
    </div>
  }

  const failureDisplay = () => {
    return <div>
      {failedUsersDisplay()}
      <Typography sx={{mt: 2}}>
        Please retry the failed users. If the issue persists, check the logs or complete the action manually.
      </Typography>
    </div>
  }

  const bodyDisplay = () => {
    if (hasSuccesses && hasFailures) {
      return partialSuccessDisplay()
    }

    if (hasFailures) {
      return failureDisplay()
    }

    return successDisplay()
  }

  const actionLabel = () => {
    switch (props.message.toLowerCase()) {
      case "granted" :
        return "approved"
      case "revert" :
        return "reverted"
      default :
        return "dismissed"
    }
  }

  const titleDisplay = () => {
    if (hasSuccesses && hasFailures) {
      return `User access request partially ${actionLabel()}`
    }

    if (hasFailures) {
      return `User access request could not be ${actionLabel()}`
    }

    return `User access request ${actionLabel()}`
  }

  return (
    <div className="flex-container">
      <div>
        <Box sx={style}>
          <Typography align="center" id="modal-modal-title" variant="h6" component="h2">
            {titleDisplay()}
          </Typography>
          <br/>
          {bodyDisplay()}
          <Button style={{float: 'right'}} onClick={resetRequestPosted}>back</Button>
        </Box>
      </div>
    </div>
  );
}
