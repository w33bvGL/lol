function getUserFriendsList(userFriends, currentUserId) {
  console.log(userFriends);
  try {
    let request = window.indexedDB.open("userData", 1);

    request.onsuccess = function (event) {
      let db = event.target.result;
      const transaction = db.transaction(["friends"], "readwrite");
      const objectStore = transaction.objectStore("friends");

      const existingDataRequest = objectStore.getAll();

      existingDataRequest.onsuccess = function () {
        const existingData = existingDataRequest.result;
        const existingFriendIds = existingData.map((friend) => friend.id);

        const newFriendIds = userFriends.map((friend) => friend.friendId)
                                         .filter((friendId) => !existingFriendIds.includes(friendId));
        console.log(newFriendIds); 
        
        if (newFriendIds.length > 0 && !arraysAreEqual(newFriendIds, existingFriendIds)) {
          console.log("Новый список друзей не совпадает с существующим. Выполняем запрос.");

          fetch("_inc/_user/getUserFriends.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userFriends: userFriends, currentUserId }),
          })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Ошибка HTTP: " + response.status);
            }
            return response.json();
          })
          .then((data) => {
            console.log(data)
            const addTransaction = db.transaction(["friends"], "readwrite");
            const addObjectStore = addTransaction.objectStore("friends");

            existingData.forEach((existingFriend) => {
              if (
                !data.some((newFriend) => newFriend.id === existingFriend.id)
              ) {
                addObjectStore.delete(existingFriend.id);
                console.log("old datas is deleted ");
                
              }
            });

            data.forEach((newFriend) => {
              newFriend.forEach((friend) => {
                addObjectStore.put(friend, friend.id);
                console.log("new data is added in indexDb");
              });
              printUsersFromIndexedDB()
            });

            addTransaction.onerror = function (event) {
              console.error(
                "error to adding in database:",
                event.target.error
              );
            };
          })
          .catch((error) => {
            console.error("error to connect database:", error);
          });
        } else {
          console.log("no new users");
          printUsersFromIndexedDB();
        }
      };
    };

    request.onerror = function (event) {
      console.error("Error indexdb connected :", event.target.error);
    };
  } catch (error) {
    console.error(error);
  }
}

function arraysAreEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

function printUsersFromIndexedDB() {
  console.log("sins");
  try {
    let request = window.indexedDB.open("userData", 1);
    request.onsuccess = function (event) {
      let db = event.target.result;
      const transaction = db.transaction(["friends"], "readonly");
      const objectStore = transaction.objectStore("friends");

      const getAllUsersRequest = objectStore.getAll();

      getAllUsersRequest.onsuccess = function () {
        const users = getAllUsersRequest.result;
        console.log("indexdb users:", users);
        const usersContainer = document.getElementById("chats");

        users.forEach(user => {
          console.log("ID:", user.id, "userName:", user.username, "email:", user.email, "firstName:", user.firstName, "lastName:", user.lastName);

          // Create user HTML string using template literals
          const userHtml = `
            <div class="user" onclick="openChatBlockforSelectedUser(${user.id}, '${user.username}', '${user.firstName}', '${user.lastName}');" id="user-${user.id}">
              <div class="user-image">
                <img src="../../assets/user/userBackgroundNoLoaded.png" alt="User Image">
                <div class="user-status is-online"></div>
              </div>
              <div class="user-info">
                <div class="name-time">
                  <p class="username">${user.firstName + ' ' + user.lastName}</p>
                  <span class="message-send-time">PM</span>
                </div>
                <div class="message-send">
                  <p></p>
                  <div class="new-message-banner">
                    <p>5</p>
                  </div>
                </div>
              </div>
            </div>
          `;
          usersContainer.insertAdjacentHTML('beforeend', userHtml);
        });
      };
    };

    request.onerror = function (event) {
      console.error("error in indexdb null userdata:", event.target.error);
    };
  } catch (error) {
    console.error(error);
  }
}

