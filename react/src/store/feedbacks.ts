import {useEffect, useState} from "react";
import axios from "axios";
import ApiClient from "../services/ApiClient";

export interface UserFeedback {
  email: string,
  actionedAt: string,
  feedbackAt: string,
  closeBanner: string,
  feedbackType: string,
  bfRole: string,
  drtQuality: string,
  drtLikes: string,
  drtImprovements: string,
  participationInterest: string,
  aOrBTest: string
}

export const useUserFeedbacks = (requestedAt : number) => {
  const [userFeedbacks, setUserFeedbacks] = useState<UserFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const fetch = async () => axios
      .get(`${ApiClient.getFeedBacksEndpoint}`)
      .then(res => setUserFeedbacks(res.data as UserFeedback[]))
      .catch(err => {
        console.log('Failed to get health check pauses: ' + err)
        setFailed(true)
      })
      .finally(() => setLoading(false))
    fetch()
  },[requestedAt])

  return {userFeedbacks, loading, failed}
}
