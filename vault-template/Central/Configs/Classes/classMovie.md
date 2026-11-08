---
fields:
- name: Director
  type: Input
  options: {}
  path: ''
  id: movDir
- name: Status
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': inbox
      '2': done
  path: ''
  id: movSts
- name: Release_Year
  type: Number
  options: {}
  path: ''
  id: movRel
- name: Rating
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': '1'
      '2': '2'
      '3': '3'
      '4': '4'
      '5': '5'
  path: ''
  id: movRat
- name: Watched
  type: Date
  options:
    dateFormat: DD-MM-YYYY
  path: ''
  id: movWat
- name: Genres
  type: Input
  options: {}
  path: ''
  id: movGen
- name: Poster
  type: Input
  options: {}
  path: ''
  id: movPos
- name: Main_Cast
  type: Input
  options: {}
  path: ''
  id: movCst
- name: Overview
  type: Input
  options: {}
  path: ''
  id: movOvr
- name: Trailer
  type: Input
  options: {}
  path: ''
  id: movTrl
version: '4.0'
limit: 20
mapWithTag: false
icon: package
tagNames: null
filesPaths: null
bookmarksGroups: null
excludes: null
extends: classBase
savedViews: []
favoriteView: null
fieldsOrder:
- movDir
- movSts
- movRel
- movRat
- movWat
- movGen
- movPos
- movCst
- movOvr
- movTrl
---
