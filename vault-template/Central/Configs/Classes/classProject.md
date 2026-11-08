---
fields:
- name: Parent
  type: File
  options:
    dvQueryString: dv.pages('"Central/Professional/Ventures"').where(p => p.Class === 'classVenture')
  path: ''
  id: prjPar
- name: Subtype
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': product
      '2': initiative
      '3': internal
      '4': client
      '5': drop
      '6': campaign
  path: ''
  id: prjSub
- name: Version
  type: Input
  options: {}
  path: ''
  id: prjVer
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
  id: prjPri
- name: Deadline
  type: Date
  options:
    dateFormat: DD-MM-YYYY
  path: ''
  id: prjDed
- name: Repo
  type: Input
  options: {}
  path: ''
  id: prjRep
- name: URL
  type: Input
  options: {}
  path: ''
  id: prjUrl
- name: Canvas
  type: Input
  options: {}
  path: ''
  id: prjCnv
- name: NotebookLM
  type: Input
  options: {}
  path: ''
  id: prjNlm
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
- prjPar
- prjSub
- prjVer
- prjPri
- prjDed
- prjRep
- prjUrl
- prjCnv
- prjNlm
---
