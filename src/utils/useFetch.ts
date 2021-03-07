import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {toggleLoading} from '../store/reducers/identify';

const useFetch = (type: string) => {
  const [data, setData] = useState<number[]>([]);
  const [request, setRequest] = useState<string>(type);

  const dispatch = useDispatch();
  const setLoading = useCallback(() => dispatch(toggleLoading()), [dispatch])
 
  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      if(request === '') {
        return;
      }

      setLoading();

      const response = await fetch('/fl-hetero/sampling/', {
        method: 'POST',
        body: JSON.stringify({
          // samplingType: request
          samplingType: 'samples'
        })
      })

      const res = await response.json();
      if(!ignore) {
        setData(res.data);
        setLoading();
      }
    }

    fetchData();

    return () => {
      ignore = true;
    }
  }, [request, setLoading])

  return [
    data,
    setRequest
  ]
}

export default useFetch;
