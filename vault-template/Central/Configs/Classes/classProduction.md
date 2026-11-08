---
fields:
- name: Parent
  type: File
  options: {}
  path: ''
  id: prdPar
- name: Stage
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': ideation
      '2': scripting
      '3': recording
      '4': editing
      '5': published
  path: ''
  id: prdStg
- name: Format
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': youtube
      '2': reel
      '3': post
      '4': carousel
  path: ''
  id: prdFmt
- name: Priority
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': '5'
      '2': '4'
      '3': '3'
      '4': '2'
      '5': '1'
  path: ''
  id: prdPri
- name: Deadline
  type: Date
  options:
    dateFormat: DD-MM-YYYY
  path: ''
  id: prdDed
- name: URL
  type: Input
  options: {}
  path: ''
  id: prdUrl
- name: Canvas
  type: Input
  options: {}
  path: ''
  id: prdCnv
version: '4.0'
limit: 20
mapWithTag: false
icon: package
tagNames: null
filesPaths: null
bookmarksGroups: null
excludes: null
extends: classTracked
savedViews: []
favoriteView: null
fieldsOrder:
- prdPar
- prdStg
- prdFmt
- prdPri
- prdDed
- prdUrl
- prdCnv
---
