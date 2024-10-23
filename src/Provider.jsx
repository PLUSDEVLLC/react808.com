import React, { useReducer, createContext } from 'react'
import { sequenceList } from './constants/config'

const Context = createContext({
    sequence: {},
    toggleNote: () => { },
    selectSequence: () => { },
})

const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SEQUENCE':
            return {
                ...sequenceList.find(seq => seq.id === action.value)
            }
        case 'SET_ON_NOTES':
            return {
                ...state,
                trackList: state.trackList.map((track, trackID) => {
                    if (action.trackID === trackID) {
                        return {
                            ...track,
                            onNotes: action.value
                        }
                    } else {
                        return track
                    }
                })
            }
        default:
            return state
    }
}

const Provider = ({ children }) => {
    const [sequence, dispatch] = useReducer(appReducer, { ...sequenceList[0] })

    const toggleNote = ({ trackID, stepID }) => {
        let newOnNotes
        const onNotes = sequence.trackList[trackID].onNotes

        if (onNotes.indexOf(stepID) === -1) {
            newOnNotes = [...onNotes, stepID]
        } else {
            newOnNotes = onNotes.filter(col => col !== stepID)
        }
        dispatch({
            type: 'SET_ON_NOTES',
            value: newOnNotes,
            trackID
        })
    }

    const selectSequence = (sequenceID) => {
        dispatch({
            type: 'SET_SEQUENCE',
            value: sequenceID,
        })
    }

    return (
        <Context.Provider value={{ sequence, toggleNote, selectSequence }}>
            {children}
        </Context.Provider>
    )
}

export {
    Provider,
    Context
}
