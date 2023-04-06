const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");


const itemsSchema = {
    name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to ToDo List!"
});

const item2 = new Item({
    name: "Hit + to add items."
});

const item3 = new Item({
    name: "<-- Hit this to delete items."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
    Item.find({})
      .then(items => {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(items => {
            res.redirect("/");
          })
          .catch(err => console.log(err));
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    }).catch(err => console.log(err));
  });  

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.button; 
    const item = new Item({
        name: itemName,
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}).then(foundList => {
            foundList.items.push(item);
            foundList.save().then(() => res.redirect("/" + listName));
        }).catch(err => console.log(err));
    }
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      })
      .catch(err => console.log(err));
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(() => {
            res.redirect("/" + listName);
        }).catch(err => console.log(err));
    }
});
  
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
  
    List.findOne({ name: customListName }).then(foundList => {
      if (foundList) {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      } else {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save().then(() => res.redirect("/" + customListName));
      }
    }).catch(err => console.log(err));
});  

app.listen(3000, function(){
    console.log("Server is running on http://localhost:3000");
});