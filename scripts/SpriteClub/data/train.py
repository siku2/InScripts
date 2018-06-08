import bson
import tensorflow as tf


def input_evaluation(matches):
    data = []
    for match in matches:
        data.append((
            {
                "blue": match["blue"],
                "red": match["red"]
            },
            tf.constant(match["winner"])
        ))
    return data


with open("matches.bson", "rb") as f:
    raw_matches = bson.loads(f.read())["matches"]

matches = input_evaluation(raw_matches[:10])

feature_columns = [
    tf.feature_column.indicator_column(tf.feature_column.categorical_column_with_hash_bucket(key="blue", hash_bucket_size=9000)),
    tf.feature_column.indicator_column(tf.feature_column.categorical_column_with_hash_bucket(key="red", hash_bucket_size=9000))
]
hidden_layers = 10 * [len(matches)]
classifier = tf.estimator.DNNClassifier(feature_columns=feature_columns, hidden_units=hidden_layers, n_classes=2)


def train_data():
    dataset = tf.data.Dataset.from_tensor_slices(matches)
    dataset = dataset.shuffle(1000).repeat().batch(100)
    return dataset.make_one_shot_iterator().get_next()


classifier.train(input_fn=train_data, steps=5)
