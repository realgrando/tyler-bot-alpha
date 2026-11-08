---
fields:
- name: Parent
  type: File
  options:
    dvQueryString: dv.pages('"Central/Study/Subjects"').where(p => p.Class === 'classSubject')
  path: ''
  id: sbjPar
- name: Mastery
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
  id: sbjMas
- name: Difficulty
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
  id: sbjDif
- name: NotebookLM
  type: Input
  options: {}
  path: ''
  id: sbjNlm
- name: Anki_Deck
  type: Input
  options: {}
  path: ''
  id: sbjAnk
- name: Canvas
  type: Input
  options: {}
  path: ''
  id: sbjCnv
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
- sbjPar
- sbjMas
- sbjDif
- sbjNlm
- sbjAnk
- sbjCnv
---
