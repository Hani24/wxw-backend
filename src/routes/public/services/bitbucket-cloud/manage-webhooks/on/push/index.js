const express = require('express');
const router = express.Router();

// /public/services/bitbucket-cloud/manage-webhooks/on/push/
// https://api.3dmadcat.ru/public/services/bitbucket-cloud/manage-webhooks/on/push/


module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    // try{

    //   const data = req.getPost();
    //   const query = req.query;
    //   const path = req.path;

    //   // console.json({data, query, path});
    //   // console.json(res.info);

    //   // actor.display_name: viacheslav
    //   // repository.links.self.href: "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server

    //   console.debug(`build: [start]: ${App.getISODate()}`);
    //   const buildRes = await console.shell.async(`build-uis`);
    //   if( !buildRes.success ){
    //     console.error(`build: [error]: ${buildRes.message}`);
    //   }else{
    //     // to see all details =>
    //     // console.logTime(false);
    //     // console.json(buildRes.data.split('\n'));
    //     // console.logTime(true);
    //     console.ok(`build: [success]: ${buildRes.message}`);
    //   }

    //   App.json( res, true, App.t('success', res.lang), {});

    // }catch(e){
    //   console.log(e);
    //   App.onRouteError( req, res, e );
    //   // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    // }

  });

  return { router, method: '', autoDoc:{} };

};

// res.info => {
//   "method": "post",
//   "path": "/public/services/bitbucket-cloud/manage-webhooks/on/push/",
//   "origin": "",
//   "protocol": "https",
//   "secure": true,
//   "start": 1657105872170,
//   "country": "US",
//   "timezone": "America/Los_Angeles",
//   "ray": "n/a",
//   "ip": "18.246.31.227",
//   "host": "api.3dmadcat.ru",
//   "lat": 45.8491,
//   "lon": -119.7143
// }


/*
{

  "push": {
    "changes": [
      {
        "forced": false,
        "old": {
          "name": "master",
          "links": {
            "commits": {
              "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commits/master"
            },
            "self": {
              "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/refs/branches/master"
            },
            "html": {
              "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server/branch/master"
            }
          },
          "default_merge_strategy": "merge_commit",
          "merge_strategies": [
            "merge_commit",
            "squash",
            "fast_forward"
          ],
          "type": "branch",
          "target": {
            "rendered": {},
            "hash": "4f6ea67aaaa500e35d7cb46534744caecd1346a7",
            "links": {
              "self": {
                "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commit/4f6ea67aaaa500e35d7cb46534744caecd1346a7"
              },
              "html": {
                "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server/commits/4f6ea67aaaa500e35d7cb46534744caecd1346a7"
              }
            },
            "author": {
              "raw": "ch3ll0v3k <ch3ll0v3k@yandex.com>",
              "type": "author",
              "user": {
                "display_name": "ch3ll0v3k",
                "uuid": "{bea1111d-1c40-4666-926e-834092884038}",
                "links": {
                  "self": {
                    "href": "https://api.bitbucket.org/2.0/users/%7Bbea1111d-1c40-4666-926e-834092884038%7D"
                  },
                  "html": {
                    "href": "https://bitbucket.org/%7Bbea1111d-1c40-4666-926e-834092884038%7D/"
                  },
                  "avatar": {
                    "href": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:1f69607f-d4b7-495a-a060-4228ae793bd2/c8ee4c33-81cd-4008-a065-c8286a883d41/128"
                  }
                },
                "type": "user",
                "nickname": "ch3ll0v3k",
                "account_id": "557058:1f69607f-d4b7-495a-a060-4228ae793bd2"
              }
            },
            "summary": {
              "raw": "\"push: [webhooks][cloud-callback] test\"\n",
              "markup": "markdown",
              "html": "<p>\"push: [webhooks][cloud-callback] test\"</p>",
              "type": "rendered"
            },
            "parents": [
              {
                "hash": "6b9f6e04a5c4faeda964a4173a7e5bdaa3819ee9",
                "type": "commit",
                "links": {
                  "self": {
                    "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commit/6b9f6e04a5c4faeda964a4173a7e5bdaa3819ee9"
                  },
                  "html": {
                    "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server/commits/6b9f6e04a5c4faeda964a4173a7e5bdaa3819ee9"
                  }
                }
              }
            ],
            "date": "2022-07-06T11:08:33+00:00",
            "message": "\"push: [webhooks][cloud-callback] test\"\n",
            "type": "commit",
            "properties": {}
          }
        },
        "links": {
          "commits": {
            "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commits?include=af016da10a1ee88670c06cb5a3327a756cd4e4b5&exclude=4f6ea67aaaa500e35d7cb46534744caecd1346a7"
          },
          "html": {
            "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server/branches/compare/af016da10a1ee88670c06cb5a3327a756cd4e4b5..4f6ea67aaaa500e35d7cb46534744caecd1346a7"
          },
          "diff": {
            "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/diff/af016da10a1ee88670c06cb5a3327a756cd4e4b5..4f6ea67aaaa500e35d7cb46534744caecd1346a7"
          }
        },
        "created": false,
        "commits": [
          {
            "rendered": {},
            "hash": "af016da10a1ee88670c06cb5a3327a756cd4e4b5",
            "links": {
              "self": {
                "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commit/af016da10a1ee88670c06cb5a3327a756cd4e4b5"
              },
              "comments": {
                "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commit/af016da10a1ee88670c06cb5a3327a756cd4e4b5/comments"
              },
              "patch": {
                "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/patch/af016da10a1ee88670c06cb5a3327a756cd4e4b5"
              },
              "html": {
                "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server/commits/af016da10a1ee88670c06cb5a3327a756cd4e4b5"
              },
              "diff": {
                "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/diff/af016da10a1ee88670c06cb5a3327a756cd4e4b5"
              },
              "approve": {
                "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commit/af016da10a1ee88670c06cb5a3327a756cd4e4b5/approve"
              },
              "statuses": {
                "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commit/af016da10a1ee88670c06cb5a3327a756cd4e4b5/statuses"
              }
            },
            "author": {
              "raw": "ch3ll0v3k <ch3ll0v3k@yandex.com>",
              "type": "author",
              "user": {
                "display_name": "ch3ll0v3k",
                "uuid": "{bea1111d-1c40-4666-926e-834092884038}",
                "links": {
                  "self": {
                    "href": "https://api.bitbucket.org/2.0/users/%7Bbea1111d-1c40-4666-926e-834092884038%7D"
                  },
                  "html": {
                    "href": "https://bitbucket.org/%7Bbea1111d-1c40-4666-926e-834092884038%7D/"
                  },
                  "avatar": {
                    "href": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:1f69607f-d4b7-495a-a060-4228ae793bd2/c8ee4c33-81cd-4008-a065-c8286a883d41/128"
                  }
                },
                "type": "user",
                "nickname": "ch3ll0v3k",
                "account_id": "557058:1f69607f-d4b7-495a-a060-4228ae793bd2"
              }
            },
            "summary": {
              "raw": "\"push: [webhooks][cloud-callback] test\"\n",
              "markup": "markdown",
              "html": "<p>\"push: [webhooks][cloud-callback] test\"</p>",
              "type": "rendered"
            },
            "parents": [
              {
                "hash": "4f6ea67aaaa500e35d7cb46534744caecd1346a7",
                "type": "commit",
                "links": {
                  "self": {
                    "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commit/4f6ea67aaaa500e35d7cb46534744caecd1346a7"
                  },
                  "html": {
                    "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server/commits/4f6ea67aaaa500e35d7cb46534744caecd1346a7"
                  }
                }
              }
            ],
            "date": "2022-07-06T11:09:34+00:00",
            "message": "\"push: [webhooks][cloud-callback] test\"\n",
            "type": "commit",
            "properties": {}
          }
        ],
        "truncated": false,
        "closed": false,
        "new": {
          "name": "master",
          "links": {
            "commits": {
              "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commits/master"
            },
            "self": {
              "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/refs/branches/master"
            },
            "html": {
              "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server/branch/master"
            }
          },
          "default_merge_strategy": "merge_commit",
          "merge_strategies": [
            "merge_commit",
            "squash",
            "fast_forward"
          ],
          "type": "branch",
          "target": {
            "rendered": {},
            "hash": "af016da10a1ee88670c06cb5a3327a756cd4e4b5",
            "links": {
              "self": {
                "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commit/af016da10a1ee88670c06cb5a3327a756cd4e4b5"
              },
              "html": {
                "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server/commits/af016da10a1ee88670c06cb5a3327a756cd4e4b5"
              }
            },
            "author": {
              "raw": "ch3ll0v3k <ch3ll0v3k@yandex.com>",
              "type": "author",
              "user": {
                "display_name": "ch3ll0v3k",
                "uuid": "{bea1111d-1c40-4666-926e-834092884038}",
                "links": {
                  "self": {
                    "href": "https://api.bitbucket.org/2.0/users/%7Bbea1111d-1c40-4666-926e-834092884038%7D"
                  },
                  "html": {
                    "href": "https://bitbucket.org/%7Bbea1111d-1c40-4666-926e-834092884038%7D/"
                  },
                  "avatar": {
                    "href": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:1f69607f-d4b7-495a-a060-4228ae793bd2/c8ee4c33-81cd-4008-a065-c8286a883d41/128"
                  }
                },
                "type": "user",
                "nickname": "ch3ll0v3k",
                "account_id": "557058:1f69607f-d4b7-495a-a060-4228ae793bd2"
              }
            },
            "summary": {
              "raw": "\"push: [webhooks][cloud-callback] test\"\n",
              "markup": "markdown",
              "html": "<p>\"push: [webhooks][cloud-callback] test\"</p>",
              "type": "rendered"
            },
            "parents": [
              {
                "hash": "4f6ea67aaaa500e35d7cb46534744caecd1346a7",
                "type": "commit",
                "links": {
                  "self": {
                    "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server/commit/4f6ea67aaaa500e35d7cb46534744caecd1346a7"
                  },
                  "html": {
                    "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server/commits/4f6ea67aaaa500e35d7cb46534744caecd1346a7"
                  }
                }
              }
            ],
            "date": "2022-07-06T11:09:34+00:00",
            "message": "\"push: [webhooks][cloud-callback] test\"\n",
            "type": "commit",
            "properties": {}
          }
        }
      }
    ]
  },
  "actor": {
    "display_name": "viacheslav",
    "uuid": "{4f4ce394-d2ea-429f-9d9b-fab06aee467d}",
    "links": {
      "self": {
        "href": "https://api.bitbucket.org/2.0/users/%7B4f4ce394-d2ea-429f-9d9b-fab06aee467d%7D"
      },
      "html": {
        "href": "https://bitbucket.org/%7B4f4ce394-d2ea-429f-9d9b-fab06aee467d%7D/"
      },
      "avatar": {
        "href": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5f0ed39907efc400281a52f6/8e131692-55c0-4f47-9d0a-6b84959d5382/128"
      }
    },
    "type": "user",
    "nickname": "viacheslav",
    "account_id": "5f0ed39907efc400281a52f6"
  },
  "repository": {
    "scm": "git",
    "website": null,
    "uuid": "{83679363-d821-45ad-a96b-3a3f2dbcdf7f}",
    "links": {
      "self": {
        "href": "https://api.bitbucket.org/2.0/repositories/ams_llc/morris-armstrong-ii.api-server"
      },
      "html": {
        "href": "https://bitbucket.org/ams_llc/morris-armstrong-ii.api-server"
      },
      "avatar": {
        "href": "https://bytebucket.org/ravatar/%7B83679363-d821-45ad-a96b-3a3f2dbcdf7f%7D?ts=default"
      }
    },
    "project": {
      "links": {
        "self": {
          "href": "https://api.bitbucket.org/2.0/workspaces/ams_llc/projects/WXW"
        },
        "html": {
          "href": "https://bitbucket.org/ams_llc/workspace/projects/WXW"
        },
        "avatar": {
          "href": "https://bitbucket.org/account/user/ams_llc/projects/WXW/avatar/32?ts=1656928657"
        }
      },
      "type": "project",
      "name": "WXW Delivery - Morris",
      "key": "WXW",
      "uuid": "{b9483d0a-44df-46ea-9568-6bc9f955b813}"
    },
    "full_name": "ams_llc/morris-armstrong-ii.api-server",
    "owner": {
      "display_name": "Interexy LLC",
      "uuid": "{90c5b587-2d98-4ef0-b463-6624d69c1b8c}",
      "links": {
        "self": {
          "href": "https://api.bitbucket.org/2.0/users/%7B90c5b587-2d98-4ef0-b463-6624d69c1b8c%7D"
        },
        "html": {
          "href": "https://bitbucket.org/%7B90c5b587-2d98-4ef0-b463-6624d69c1b8c%7D/"
        },
        "avatar": {
          "href": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5e78a1ba79f5ad0c34f7d998/69d1d1f0-0345-4a1b-b724-723c7f39d7b5/128"
        }
      },
      "type": "user",
      "nickname": "Interexy LLC",
      "account_id": "5e78a1ba79f5ad0c34f7d998"
    },
    "workspace": {
      "slug": "ams_llc",
      "type": "workspace",
      "name": "AMS LLC",
      "links": {
        "self": {
          "href": "https://api.bitbucket.org/2.0/workspaces/ams_llc"
        },
        "html": {
          "href": "https://bitbucket.org/ams_llc/"
        },
        "avatar": {
          "href": "https://bitbucket.org/workspaces/ams_llc/avatar/?ts=1584964069"
        }
      },
      "uuid": "{90c5b587-2d98-4ef0-b463-6624d69c1b8c}"
    },
    "type": "repository",
    "is_private": true,
    "name": "morris-armstrong-ii.api-server"
  }
}

*/