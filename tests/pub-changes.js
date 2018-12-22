const test = require('tape')
const Server = require('scuttle-testbot')
const ssbKeys = require('ssb-keys')
const pull = require('pull-stream')

const keyMe = ssbKeys.generate()
const keyFriend = ssbKeys.generate()
const keyPub = ssbKeys.generate()

test('pub changes', t => {
  Server.use(require('ssb-backlinks'))
    .use(require('scuttlebot/plugins/replicate'))
    .use(require('ssb-friends'))
    .use(require('..'))

  const server = Server({name: 'test.change-hops', keys: keyMe })
     
  var me = server.createFeed(keyMe)
  var friend = server.createFeed(keyFriend)
  var pub = server.createFeed(keyPub)

  let stateIndex = 0

  server.friendPub.pubChanges(pubs => {
    if (stateIndex == 0)
      t.equal(Object.keys(server.friendPub.pubs()).length, 0, "0 pubs available")
    if (stateIndex == 2) { // 1 is reset pubs
      t.equal(Object.keys(server.friendPub.pubs()).length, 1, "1 pub available")
      t.end()
      server.close()
    }

    stateIndex += 1
  })
  
  const announce = { type: 'pub-owner-announce', id: keyPub.id }
  
  friend.add(announce, (err, announceMsg) => {
    if (err) console.error(err)

    const confirm = { type: 'pub-owner-confirm', announcement: announceMsg.key,
                      address: "4fqstkswahy3n7mupr2gvvp2qcsp6juwzn3mnqvhkaixxepvxrrtfbid.onion",
                      features: ["tor", "incoming-guard"] }
    
    pub.add(confirm, (err) => {
      if (err) console.error(err)

      const befriend = { type: "contact", contact: keyFriend.id, following: true }
      me.add(befriend, (err) => {
        if (err) console.error(err)
      })
    })
  })
})
