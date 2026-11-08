---
fields:
- name: Parent
  type: File
  options: {}
  path: ''
  id: docPar
- name: Subtype
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': spec
      '2': strategy
      '3': process
      '4': sop
      '5': playbook
      '6': guide
      '7': client
      '8': partner
      '9': meeting
      '10': call
      '11': reference
      '12': benchmark
      '13': idea
      '14': concept
  path: ''
  id: docSub
- name: Priority
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
  id: docPri
- name: People
  type: MultiFile
  options:
    dvQueryString: dv.pages('"Central/Study/People"').where(p => p.Class === 'classPerson')
  path: ''
  id: docPpl
- name: URL
  type: Input
  options: {}
  path: ''
  id: docUrl
- name: Canvas
  type: Input
  options: {}
  path: ''
  id: docCnv
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
- docPar
- docSub
- docPri
- docPpl
- docUrl
- docCnv
---
