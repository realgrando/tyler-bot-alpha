---
fields:
- name: Parent
  type: File
  options:
    dvQueryString: dv.pages('"Central/Study/Subjects"').where(p => p.Class === 'classSubject')
  path: ''
  id: perPar
- name: Role
  type: Input
  options: {}
  path: ''
  id: perRol
- name: Era_Movement
  type: Input
  options: {}
  path: ''
  id: perEra
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
- perPar
- perRol
- perEra
---
